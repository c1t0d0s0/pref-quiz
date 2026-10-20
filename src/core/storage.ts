// 学年と、今日のチャレンジをクリアした日の記録 (この端末の localStorage)
import { isGrade, type Grade } from '../types';

const GRADE_KEY = 'pref-quiz:grade';
const DAILY_KEY = 'pref-quiz:daily';
const DAILY_KEEP = 400; // 学年ごとに残しておく日数 (スタンプカードで1年前までさかのぼれるように)
const DEFAULT_GRADE: Grade = 3;

/** 学年ごとの、クリアした日 (YYYY-MM-DD) */
export type DailyRecord = Partial<Record<Grade, string[]>>;

export function loadGrade(): Grade {
  try {
    const grade = Number(localStorage.getItem(GRADE_KEY));
    return isGrade(grade) ? grade : DEFAULT_GRADE;
  } catch {
    return DEFAULT_GRADE;
  }
}

export function saveGrade(grade: Grade): void {
  try {
    localStorage.setItem(GRADE_KEY, String(grade));
  } catch {
    // 保存できなくても遊べるので何もしない
  }
}

export function loadDailyRecord(): DailyRecord {
  try {
    const record: unknown = JSON.parse(localStorage.getItem(DAILY_KEY) ?? '{}');
    return record && typeof record === 'object' ? (record as DailyRecord) : {};
  } catch {
    return {};
  }
}

/** 今日のチャレンジをクリアした日を記録して、記録全体を返す */
export function recordDailyClear(grade: Grade, date: string): DailyRecord {
  const record = loadDailyRecord();
  const dates = Array.isArray(record[grade]) ? record[grade] : [];
  if (!dates.includes(date)) dates.push(date);
  record[grade] = dates.sort().slice(-DAILY_KEEP);
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(record));
  } catch {
    // 保存できなくても、今回の結果は表示する
  }
  return record;
}
