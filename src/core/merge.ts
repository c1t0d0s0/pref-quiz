// 2 か所にある記録 (たとえば、この端末と Firestore) を 1 つに合わせる。
// どの関数も、同じものを 2 回合わせても変わらず、a と b を入れかえても同じ結果になる。
// そのため、何回やっても・どの順でやっても、記録がこわれたり二重にふえたりしない。
import { GRADES } from '../types';
import { mergeCards } from './cards';
import { DAILY_KEEP } from './storage';
import type { DailyRecord, Settings, Snapshot } from './snapshot';

/** クリアした日: 両方を合わせる (同じ日は 1 つ)。古い日は storage.ts と同じだけ残す */
export function mergeDaily(a: DailyRecord, b: DailyRecord): DailyRecord {
  const out: DailyRecord = {};
  for (const grade of GRADES) {
    const dates = [...new Set([...(a[grade] ?? []), ...(b[grade] ?? [])])].sort().slice(-DAILY_KEEP);
    if (dates.length > 0) out[grade] = dates;
  }
  return out;
}

/** 学年: あとから変えたほう。時刻が同じなら、いつも同じほうをえらぶ */
export function mergeSettings(a: Settings, b: Settings): Settings {
  const [newer, older] = a.at !== b.at ? (a.at > b.at ? [a, b] : [b, a]) : (a.grade ?? 0) >= (b.grade ?? 0) ? [a, b] : [b, a];
  // まだえらんでいない (null) ときは、もう一方の値でおぎなう
  return { grade: newer.grade ?? older.grade, at: Math.max(a.at, b.at) };
}

export function mergeSnapshots(a: Snapshot, b: Snapshot): Snapshot {
  return {
    daily: mergeDaily(a.daily, b.daily),
    cards: mergeCards(a.cards, b.cards),
    settings: mergeSettings(a.settings, b.settings),
  };
}

/** 記録の中身が同じか (ならび順のちがいは気にしない) */
export function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return JSON.stringify(mergeSnapshots(a, a)) === JSON.stringify(mergeSnapshots(b, b));
}
