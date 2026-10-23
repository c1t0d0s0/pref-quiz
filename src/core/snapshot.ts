// ---- 手元の記録の形 ----
import { GRADES, isGrade, type Grade } from '../types';

/** 学年ごとの、今日のチャレンジをクリアした日 (YYYY-MM-DD) */
export type DailyRecord = Partial<Record<Grade, string[]>>;

/** 都道府県カードを集めるための、正解した都道府県の id (どちらも小さい順) */
export interface CardProgress {
  /** シルエット問題に正解した都道府県 */
  silhouette: number[];
  /** その学年の ちしき問題に正解した都道府県 */
  knowledge: number[];
}

/** 学年ごとの CardProgress。シルエットと ちしきの両方に正解した都道府県が、その学年のカードになる */
export type CardRecord = Partial<Record<Grade, CardProgress>>;

export interface Settings {
  /** えらんだ学年。まだえらんでいなければ null */
  grade: Grade | null;
  /** 学年をさいごに変えた時刻 (ミリ秒)。2 か所の記録を合わせるとき、あとから変えたほうを使う */
  at: number;
}

/** 1 人分の記録の全部。ログインなしの記録も、ログイン中の人の記録も、この形であつかう */
export interface Snapshot {
  daily: DailyRecord;
  cards: CardRecord;
  settings: Settings;
}

export function emptySnapshot(): Snapshot {
  return { daily: {}, cards: {}, settings: { grade: null, at: 0 } };
}

/** 記録が 1 つでもあるか (設定だけのときは「ない」とみなす) */
export function hasRecords(s: Snapshot): boolean {
  return (
    Object.values(s.daily).some((dates) => (dates?.length ?? 0) > 0) ||
    Object.values(s.cards).some((c) => (c?.silhouette.length ?? 0) + (c?.knowledge.length ?? 0) > 0)
  );
}

// ---- Firestore に保存する形 (小学生向けの学習アプリで共通。スズメの社会クイズ・Wordlynx と同じ) ----
//
//   users/{uid}                  その人の情報 (全アプリ共通)。名前やメールアドレスは入れない
//   users/{uid}/apps/{appId}     アプリごとの記録のまとめ (AppDoc)
//
// このアプリにはクイズの途中経過の保存がないので、progress/{itemId} は使わない。

export const SCHEMA = 1;
export const APP_ID = 'pref-quiz';

export interface UserDoc {
  schema: number;
  createdAt: number;
  updatedAt: number;
}

export interface AppDoc {
  schema: number;
  updatedAt: number;
  /** その日の目標を達成した日 (YYYY-MM-DD)。このアプリでは、どれかの学年の今日のチャレンジをクリアした日 */
  activeDays: string[];
  /**
   * やりとげた教材の id。このアプリでは今日のチャレンジ (daily-g3-2026-10-20 のような形) と、
   * カードのための正解 (silhouette-g3-13・knowledge-g3-13 のような形。13 は都道府県の id)
   */
  completed: string[];
  /** 手に入れたごほうび。このアプリでは都道府県カード (card-g3-13 のような形)。正解の記録から作るので、読むときは使わない */
  inventory: Record<string, { paid: number }>;
  /** 使ったポイント。このアプリでは使わない */
  spent: Record<string, number>;
  /** アプリごとの設定 */
  settings: Record<string, unknown>;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const dailyId = (grade: Grade, date: string) => `daily-g${grade}-${date}`;
const DAILY_ID = /^daily-g(\d)-(\d{4}-\d{2}-\d{2})$/;
const progressId = (kind: keyof CardProgress, grade: Grade, prefId: number) => `${kind}-g${grade}-${prefId}`;
const PROGRESS_ID = /^(silhouette|knowledge)-g(\d)-(\d{1,2})$/;
const PREFECTURE_COUNT = 47;

export function toAppDoc(s: Snapshot, now: number): AppDoc {
  const completed: string[] = [];
  const days = new Set<string>();
  for (const grade of GRADES) {
    for (const date of s.daily[grade] ?? []) {
      completed.push(dailyId(grade, date));
      days.add(date);
    }
  }
  const inventory: AppDoc['inventory'] = {};
  for (const grade of GRADES) {
    const progress = s.cards[grade];
    if (!progress) continue;
    for (const kind of ['silhouette', 'knowledge'] as const) {
      for (const id of progress[kind]) completed.push(progressId(kind, grade, id));
    }
    for (const id of progress.silhouette) {
      if (progress.knowledge.includes(id)) inventory[`card-g${grade}-${id}`] = { paid: 0 };
    }
  }
  return {
    schema: SCHEMA,
    updatedAt: now,
    activeDays: [...days].sort(),
    completed: completed.sort(),
    inventory,
    spent: {},
    settings: { grade: s.settings.grade, at: s.settings.at },
  };
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** Firestore から読んだものは形がくずれているかもしれないので、1 つずつ確かめながらもどす */
export function fromAppDoc(doc: Partial<AppDoc> | null | undefined): Snapshot {
  const s = emptySnapshot();
  if (!doc) return s;
  for (const id of strings(doc.completed)) {
    const p = PROGRESS_ID.exec(id);
    if (p) {
      const grade = Number(p[2]);
      const prefId = Number(p[3]);
      if (!isGrade(grade) || prefId < 1 || prefId > PREFECTURE_COUNT) continue;
      (s.cards[grade] ??= { silhouette: [], knowledge: [] })[p[1] as keyof CardProgress].push(prefId);
      continue;
    }
    const m = DAILY_ID.exec(id);
    const grade = Number(m?.[1]);
    if (!m || !isGrade(grade) || !DATE.test(m[2])) continue;
    (s.daily[grade] ??= []).push(m[2]);
  }
  for (const grade of GRADES) {
    s.daily[grade]?.sort();
    const progress = s.cards[grade];
    if (progress) {
      progress.silhouette = [...new Set(progress.silhouette)].sort((a, b) => a - b);
      progress.knowledge = [...new Set(progress.knowledge)].sort((a, b) => a - b);
    }
  }
  const st = doc.settings ?? {};
  s.settings = {
    grade: isGrade(st.grade) ? st.grade : null,
    at: typeof st.at === 'number' ? st.at : 0,
  };
  return s;
}
