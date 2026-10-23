// 都道府県カード: 同じ都道府県の シルエット問題と ちしき問題の両方に正解すると、その都道府県のカードがもらえる。
// カードは学年ごとに集める。正解は、何回かに分けてもよい (同じクイズの中でなくてよい)
import { GRADES, type AnswerRecord, type Grade } from '../types';
import type { CardProgress, CardRecord } from './snapshot';

export type { CardProgress, CardRecord } from './snapshot';

/** 1枚のカード */
export interface CardEntry {
  grade: Grade;
  prefId: number;
}

const sortedUnion = (a: readonly number[], b: readonly number[]) => [...new Set([...a, ...b])].sort((x, y) => x - y);

/** その学年で持っているカードの都道府県 id (小さい順) */
export function ownedCards(progress: CardProgress | undefined): number[] {
  if (!progress) return [];
  const knowledge = new Set(progress.knowledge);
  return progress.silhouette.filter((id) => knowledge.has(id));
}

/**
 * クイズの答えから、正解した分を記録に足す (record は書きかえず、新しい記録を返す)。
 * シルエット問題は、えらんでいる学年 (grade) の正解にする。
 * ちしき問題は、その問題の学年の正解にする (学年に合った問題に答えたときだけ、その学年のカードに近づく)
 */
export function addAnswers(record: CardRecord, answers: readonly AnswerRecord[], grade: Grade): CardRecord {
  const out: CardRecord = {};
  for (const g of GRADES) {
    const p = record[g];
    if (p) out[g] = { silhouette: [...p.silhouette], knowledge: [...p.knowledge] };
  }
  for (const a of answers) {
    if (!a.correct) continue;
    const g = a.item.type === 'silhouette' ? grade : a.item.question.grade;
    const kind = a.item.type === 'silhouette' ? 'silhouette' : 'knowledge';
    const p = (out[g] ??= { silhouette: [], knowledge: [] });
    p[kind] = sortedUnion(p[kind], [a.item.answer.id]);
  }
  return out;
}

/** before になくて after にあるカード (学年の順、都道府県の id の順) */
export function newCards(before: CardRecord, after: CardRecord): CardEntry[] {
  return GRADES.flatMap((grade) => {
    const had = new Set(ownedCards(before[grade]));
    return ownedCards(after[grade])
      .filter((prefId) => !had.has(prefId))
      .map((prefId) => ({ grade, prefId }));
  });
}

/** 2 か所の記録を合わせる (同じものを 2 回合わせても、入れかえても同じ結果) */
export function mergeCards(a: CardRecord, b: CardRecord): CardRecord {
  const out: CardRecord = {};
  for (const grade of GRADES) {
    const silhouette = sortedUnion(a[grade]?.silhouette ?? [], b[grade]?.silhouette ?? []);
    const knowledge = sortedUnion(a[grade]?.knowledge ?? [], b[grade]?.knowledge ?? []);
    if (silhouette.length > 0 || knowledge.length > 0) out[grade] = { silhouette, knowledge };
  }
  return out;
}
