// ---- 手元の記録の形 ----
import { GRADES, isGrade, type Grade } from '../types';

/** 学年ごとの、今日のチャレンジをクリアした日 (YYYY-MM-DD) */
export type DailyRecord = Partial<Record<Grade, string[]>>;

export interface Settings {
  /** えらんだ学年。まだえらんでいなければ null */
  grade: Grade | null;
  /** 学年をさいごに変えた時刻 (ミリ秒)。2 か所の記録を合わせるとき、あとから変えたほうを使う */
  at: number;
}

/** 1 人分の記録の全部。ログインなしの記録も、ログイン中の人の記録も、この形であつかう */
export interface Snapshot {
  daily: DailyRecord;
  settings: Settings;
}

export function emptySnapshot(): Snapshot {
  return { daily: {}, settings: { grade: null, at: 0 } };
}

/** 記録が 1 つでもあるか (設定だけのときは「ない」とみなす) */
export function hasRecords(s: Snapshot): boolean {
  return Object.values(s.daily).some((dates) => (dates?.length ?? 0) > 0);
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
  /** やりとげた教材の id。このアプリでは今日のチャレンジ (daily-g3-2026-10-20 のような形) */
  completed: string[];
  /** 手に入れたごほうび。このアプリでは使わない (ほかのアプリと形をそろえるために置く) */
  inventory: Record<string, { paid: number }>;
  /** 使ったポイント。このアプリでは使わない */
  spent: Record<string, number>;
  /** アプリごとの設定 */
  settings: Record<string, unknown>;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const dailyId = (grade: Grade, date: string) => `daily-g${grade}-${date}`;
const DAILY_ID = /^daily-g(\d)-(\d{4}-\d{2}-\d{2})$/;

export function toAppDoc(s: Snapshot, now: number): AppDoc {
  const completed: string[] = [];
  const days = new Set<string>();
  for (const grade of GRADES) {
    for (const date of s.daily[grade] ?? []) {
      completed.push(dailyId(grade, date));
      days.add(date);
    }
  }
  return {
    schema: SCHEMA,
    updatedAt: now,
    activeDays: [...days].sort(),
    completed: completed.sort(),
    inventory: {},
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
    const m = DAILY_ID.exec(id);
    const grade = Number(m?.[1]);
    if (!m || !isGrade(grade) || !DATE.test(m[2])) continue;
    (s.daily[grade] ??= []).push(m[2]);
  }
  for (const grade of GRADES) s.daily[grade]?.sort();
  const st = doc.settings ?? {};
  s.settings = {
    grade: isGrade(st.grade) ? st.grade : null,
    at: typeof st.at === 'number' ? st.at : 0,
  };
  return s;
}
