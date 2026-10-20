// スタンプカード: 今日のチャレンジをクリアした日に、その日のスタンプを押す
import { rngFromString } from './rng';

const PREFECTURE_COUNT = 47;

export interface StampDay {
  date: string;
  day: number;
  stamped: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface MonthCalendar {
  /** 1日の前の空きマスの数 (日曜はじまり) */
  leading: number;
  days: StampDay[];
}

/** 2026-10-20 → 2026-10 */
export const monthOf = (date: string): string => date.slice(0, 7);

/** 2026-10 に n か月を足す */
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

/** その月のカレンダー。stamped は、クリアした日 (YYYY-MM-DD) */
export function monthCalendar(month: string, stamped: readonly string[], today: string): MonthCalendar {
  const [y, m] = month.split('-').map(Number);
  const leading = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const length = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const done = new Set(stamped);
  const days = Array.from({ length }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, '0')}`;
    return { date, day: i + 1, stamped: done.has(date), isToday: date === today, isFuture: date > today };
  });
  return { leading, days };
}

/** その日のスタンプの絵になる都道府県の id。日付で決まる (同じ日はいつも同じ都道府県) */
export function stampPrefectureId(date: string): number {
  return Math.floor(rngFromString(`stamp-${date}`)() * PREFECTURE_COUNT) + 1;
}

/** スタンプカードでさかのぼれる、いちばん古い月 (スタンプがなければ今月) */
export function firstMonth(stamped: readonly string[], today: string): string {
  const oldest = [...stamped].sort()[0];
  return oldest && oldest < today ? monthOf(oldest) : monthOf(today);
}
