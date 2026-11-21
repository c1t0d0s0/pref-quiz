// 今日のチャレンジ: 日付と学年から、その日の10問を決める
// (日付と学年が同じなら、だれが開いても同じ問題になる)
import type { Grade, KnowledgeQuestion } from '../types';
import { addDays, dayIndex } from './date';
import { rngFromString, shuffle } from './rng';

export const DAILY_LENGTH = 10;

/** 同じ問題の間は、少なくとも一巡の (1 − GAP_SLACK) ぶんあける (470問なら約35日) */
const GAP_SLACK = 1 / 4;
/** 直前のこれだけの問題 (今日と昨日の2日分) には、同じ都道府県が答えの問題をなるべく置かない */
const PREF_WINDOW = DAILY_LENGTH * 2;

/**
 * 学年の問題を cycle 巡目の順にならべる。
 * 前から1つずつ、置ける問題の中から種つき乱数で選んで置く。
 * - 前の巡で q 番目だった問題は、q − n/4 番目より前には置かない。
 *   こうすると、同じ問題がまた出るまでに、いつも一巡の 3/4 以上の問題がはさまる
 * - 直前の20問 (今日と昨日) に同じ都道府県が答えの問題があるものは、なるべく選ばない。
 *   それができなければ直前の10問 (同じ日)、それもできなければ どれでもよい
 * - その中では、まだ置いていない問題の多い都道府県を先に選ぶ
 * previous は前の巡 (0 巡目なら null)
 */
function deckOrder(
  questions: readonly KnowledgeQuestion[],
  grade: Grade,
  cycle: number,
  previous: readonly KnowledgeQuestion[] | null,
): KnowledgeQuestion[] {
  const n = questions.length;
  const slack = Math.floor(n * GAP_SLACK);
  const earliest = new Map<KnowledgeQuestion, number>();
  previous?.forEach((q, i) => earliest.set(q, Math.max(0, i - slack)));
  const rng = rngFromString(`deck-g${grade}#${cycle}`);

  // 前の巡のおわりの問題も、都道府県の重なりを見るときに使う (巡のさかいの日のため)
  const order: KnowledgeQuestion[] = previous ? previous.slice(-(PREF_WINDOW - 1)) : [];
  const offset = order.length;
  const unused = new Set(questions);
  const clashes = (q: KnowledgeQuestion, window: number) => {
    for (let k = Math.max(0, order.length - window + 1); k < order.length; k++) {
      if (order[k].prefId === q.prefId) return true;
    }
    return false;
  };

  // 都道府県ごとの、まだ置いていない問題の数
  const left = new Map<number, number>();
  for (const q of questions) left.set(q.prefId, (left.get(q.prefId) ?? 0) + 1);
  // 残りの多い都道府県から先に置く (同じ都道府県の問題が巡のおわりにかたまらないように)。同じ数なら乱数で選ぶ
  const pick = (list: KnowledgeQuestion[]) => {
    let best: KnowledgeQuestion[] = [];
    let most = -1;
    for (const q of list) {
      const count = left.get(q.prefId)!;
      if (count > most) {
        most = count;
        best = [q];
      } else if (count === most) best.push(q);
    }
    return best[Math.floor(rng() * best.length)];
  };

  for (let pos = 0; pos < n; pos++) {
    const ready = [...unused].filter((q) => (earliest.get(q) ?? 0) <= pos);
    const fresh = ready.filter((q) => !clashes(q, PREF_WINDOW));
    const sameDayFree = fresh.length > 0 ? fresh : ready.filter((q) => !clashes(q, DAILY_LENGTH));
    const chosen = pick(sameDayFree.length > 0 ? sameDayFree : ready);
    unused.delete(chosen);
    left.set(chosen.prefId, left.get(chosen.prefId)! - 1);
    order.push(chosen);
  }
  return order.slice(offset);
}

// 巡は前の巡のさいごに合わせてならべるので、0 巡目から順に作る。作った巡はとっておいて使いまわす
const deckCache = new Map<string, KnowledgeQuestion[][]>();

/**
 * その学年の今日の10問。day 日目は、列の day × 10 番目から10問。
 * 470問ある学年なら、47日で全部の問題が1回ずつ出る
 */
export function dailyQuestions(pool: readonly KnowledgeQuestion[], grade: Grade, date: string): KnowledgeQuestion[] {
  const questions = pool.filter((q) => q.grade === grade).sort((a, b) => a.id - b.id);
  const size = questions.length;
  if (size === 0) return [];
  const length = Math.min(DAILY_LENGTH, size);

  const key = `${grade}:${questions.map((q) => q.id).join(',')}`;
  const decks = deckCache.get(key) ?? [];
  deckCache.set(key, decks);
  const deck = (cycle: number) => {
    for (let c = decks.length; c <= cycle; c++) decks.push(deckOrder(questions, grade, c, c === 0 ? null : decks[c - 1]));
    return decks[cycle];
  };

  const picked: KnowledgeQuestion[] = [];
  // 巡のさかいで同じ問題が重なったら、その先の問題に送る
  for (let position = Math.max(0, dayIndex(date)) * DAILY_LENGTH; picked.length < length; position++) {
    const cycle = Math.floor(position / size);
    const question = deck(cycle)[position - cycle * size];
    if (!picked.includes(question)) picked.push(question);
  }
  return shuffle(picked, rngFromString(`daily-g${grade}-${date}`));
}

/** dates (YYYY-MM-DD) から、今日 (まだなら昨日) までの連続日数 */
export function streakOf(dates: readonly string[], today: string): number {
  const done = new Set(dates);
  let day = done.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (done.has(day)) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}
