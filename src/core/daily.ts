// 今日のチャレンジ: 日付と学年から、その日の10問を決める
// (日付と学年が同じなら、だれが開いても同じ問題になる)
import type { Grade, KnowledgeQuestion } from '../types';
import { addDays, dayIndex } from './date';
import { rngFromString, shuffle } from './rng';

export const DAILY_LENGTH = 10;

/**
 * 学年の問題を cycle 巡目の順にならべる。
 * 問題を前半と後半の2組に分け (分け方はいつも同じ)、巡ごとにそれぞれの組の中だけでならべかえる。
 * こうすると、巡のさかいをまたいでも、同じ問題がまた出るまでに少なくとも半分の問題がはさまる。
 * before は前の巡のさいごの問題たち。巡のさかいの日にも、答えの都道府県が重ならないようにするために使う
 */
function deckOrder(
  questions: readonly KnowledgeQuestion[],
  grade: Grade,
  cycle: number,
  before: readonly KnowledgeQuestion[],
): KnowledgeQuestion[] {
  const base = shuffle(questions, rngFromString(`deck-g${grade}`));
  const half = Math.ceil(base.length / 2);
  const rng = rngFromString(`deck-g${grade}#${cycle}`);
  const order = [...before, ...shuffle(base.slice(0, half), rng), ...shuffle(base.slice(half), rng)];
  // 前半・後半それぞれの中で、答えの都道府県が近くで重ならないようにならべなおす
  spreadPrefectures(order, before.length, before.length + half);
  spreadPrefectures(order, before.length + half, order.length);
  return order.slice(before.length);
}

/**
 * order[from, to) の中で、となりあう10問 (1日分) に同じ都道府県が答えの問題が入らないように、
 * ほかの問題と入れかえる。入れかえられる問題がなければ、そのままにする
 */
function spreadPrefectures(order: KnowledgeQuestion[], from: number, to: number): void {
  const clashes = (i: number, prefId: number) => {
    for (let k = Math.max(0, i - DAILY_LENGTH + 1); k < i; k++) {
      if (order[k].prefId === prefId) return true;
    }
    return false;
  };
  for (let i = from; i < to; i++) {
    if (!clashes(i, order[i].prefId)) continue;
    for (let j = i + 1; j < to; j++) {
      if (!clashes(i, order[j].prefId)) {
        [order[i], order[j]] = [order[j], order[i]];
        break;
      }
    }
  }
  // おわりのほうは入れかえる相手が少なく重なりが残りやすいので、前のほうの問題とも入れかえてみる
  const fits = (pos: number, prefId: number, skip: number) => {
    for (let k = Math.max(0, pos - DAILY_LENGTH + 1); k < Math.min(to, pos + DAILY_LENGTH); k++) {
      if (k !== pos && k !== skip && order[k].prefId === prefId) return false;
    }
    return true;
  };
  for (let i = from; i < to; i++) {
    if (fits(i, order[i].prefId, -1)) continue;
    for (let j = from; j < to; j++) {
      if (j !== i && fits(i, order[j].prefId, j) && fits(j, order[i].prefId, i)) {
        [order[i], order[j]] = [order[j], order[i]];
        break;
      }
    }
  }
}

// 巡は前の巡のさいごに合わせてならべるので、0 巡目から順に作る。作った巡はとっておいて使いまわす
const deckCache = new Map<string, KnowledgeQuestion[][]>();

/**
 * その学年の今日の10問。day 日目は、列の day × 10 番目から10問。
 * 100問ある学年なら、10日で全部の問題が1回ずつ出る
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
    for (let c = decks.length; c <= cycle; c++) {
      const before = c === 0 ? [] : decks[c - 1].slice(-(DAILY_LENGTH - 1));
      decks.push(deckOrder(questions, grade, c, before));
    }
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
