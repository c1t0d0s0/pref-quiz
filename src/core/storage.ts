// 学年と、今日のチャレンジをクリアした日の記録 (この端末の localStorage)
//
// ログインしていない人の記録は GUEST_PREFIX の下 (前からの置き場所なので、今までの記録がそのまま使える)。
// ログイン中の人の記録 (Firestore の写し) は、人ごとに別の場所に置き、ログアウトしたら消す。
import { isGrade, type Grade } from '../types';
import { emptySnapshot, type DailyRecord, type Snapshot } from './snapshot';

export type { DailyRecord } from './snapshot';

const GUEST_PREFIX = 'pref-quiz:';
const userPrefix = (uid: string) => `pref-quiz:u:${uid}:`;
const ACTIVE_UID_KEY = 'pref-quiz:auth-uid';

/** 置き場所ごとのキー (prefix のあと) */
const GRADE_KEY = 'grade';
const DAILY_KEY = 'daily';
const SETTINGS_AT_KEY = 'settings-at';
const KEYS = [GRADE_KEY, DAILY_KEY, SETTINGS_AT_KEY];

/** 学年ごとに残しておく日数 (スタンプカードで1年前までさかのぼれるように) */
export const DAILY_KEEP = 400;
const DEFAULT_GRADE: Grade = 3;

let currentPrefix = GUEST_PREFIX;
let listener: (() => void) | null = null;
let muted = false;

/** 読み書きする記録を切りかえる。uid が null ならログインなしの記録 */
export function useStore(uid: string | null): void {
  currentPrefix = uid ? userPrefix(uid) : GUEST_PREFIX;
}

/** 今、読み書きしているのがだれの記録か。ログインなしの記録なら null */
export function currentUid(): string | null {
  return currentPrefix === GUEST_PREFIX ? null : currentPrefix.slice('pref-quiz:u:'.length, -1);
}

/** この端末で、さいごにログインしていた人。次に開いたとき、通信を待たずにその人の写しを出すために使う */
export function rememberedUid(): string | null {
  try {
    return localStorage.getItem(ACTIVE_UID_KEY);
  } catch {
    return null;
  }
}

export function rememberUid(uid: string | null): void {
  try {
    if (uid) localStorage.setItem(ACTIVE_UID_KEY, uid);
    else localStorage.removeItem(ACTIVE_UID_KEY);
  } catch {
    // 無視
  }
}

/** 記録が書きかわったら知らせてもらう (Firestore に送るため) */
export function onStorageChange(cb: (() => void) | null): void {
  listener = cb;
}

// localStorage が使えない環境 (プライベートブラウズなど) でも遊べるよう、失敗は無視する
function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(currentPrefix + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(currentPrefix + key, JSON.stringify(value));
  } catch {
    // 保存できなくても続行
  }
  if (!muted) listener?.();
}

// ---- 学年 ----

/** えらんでいる学年。まだえらんでいなければ 3 年生 */
export function loadGrade(): Grade {
  const grade = read<number>(GRADE_KEY);
  return isGrade(grade) ? grade : DEFAULT_GRADE;
}

export function saveGrade(grade: Grade): void {
  write(SETTINGS_AT_KEY, Date.now()); // 2 か所の記録を合わせるとき、あとから変えたほうを使う
  write(GRADE_KEY, grade);
}

// ---- 今日のチャレンジ ----

export function loadDailyRecord(): DailyRecord {
  const record = read<unknown>(DAILY_KEY);
  if (!record || typeof record !== 'object') return {};
  const out: DailyRecord = {};
  for (const [grade, dates] of Object.entries(record)) {
    const g = Number(grade);
    if (isGrade(g) && Array.isArray(dates)) out[g] = dates.filter((d): d is string => typeof d === 'string');
  }
  return out;
}

/** 今日のチャレンジをクリアした日を記録して、記録全体を返す */
export function recordDailyClear(grade: Grade, date: string): DailyRecord {
  const record = loadDailyRecord();
  const dates = record[grade] ?? [];
  if (!dates.includes(date)) dates.push(date);
  record[grade] = dates.sort().slice(-DAILY_KEEP);
  write(DAILY_KEY, record);
  return record;
}

// ---- 記録をまるごと出し入れする (ログイン・Firestore との同期で使う) ----

/** 今の場所にある記録を、まるごと取り出す */
export function exportSnapshot(): Snapshot {
  const s = emptySnapshot();
  s.daily = loadDailyRecord();
  const grade = read<number>(GRADE_KEY);
  const at = read<number>(SETTINGS_AT_KEY);
  s.settings = { grade: isGrade(grade) ? grade : null, at: typeof at === 'number' ? at : 0 };
  return s;
}

/**
 * 今の場所の記録を、わたされた内容に入れかえる。
 * Firestore から取りこんだ結果を書くためのものなので、「書きかわった」という知らせは出さない。
 */
export function importSnapshot(s: Snapshot): void {
  muted = true;
  try {
    write(DAILY_KEY, s.daily);
    if (s.settings.grade) write(GRADE_KEY, s.settings.grade);
    write(SETTINGS_AT_KEY, s.settings.at);
  } finally {
    muted = false;
  }
}

/** その人の記録 (uid が null ならログインなしの記録) を、この端末から消す */
export function clearStore(uid: string | null): void {
  const prefix = uid ? userPrefix(uid) : GUEST_PREFIX;
  for (const key of KEYS) {
    try {
      localStorage.removeItem(prefix + key);
    } catch {
      // 無視
    }
  }
}
