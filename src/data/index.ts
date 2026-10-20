import type { Grade, KnowledgeQuestion, Prefecture } from '../types';
import prefectures from './prefectures.json';
import grade1 from './questions/grade1.json';
import grade2 from './questions/grade2.json';
import grade3 from './questions/grade3.json';
import grade4 from './questions/grade4.json';
import grade5 from './questions/grade5.json';
import grade6 from './questions/grade6.json';
import shapes from './shapes.json';

export { SIMILAR } from './similar';

/** 47都道府県 (id 順) */
export const PREFECTURES: readonly Prefecture[] = prefectures;

const byId = new Map(PREFECTURES.map((p) => [p.id, p]));

export function prefectureById(id: number): Prefecture {
  const pref = byId.get(id);
  if (!pref) throw new Error(`都道府県 id ${id} がありません`);
  return pref;
}

/** シルエットの SVG パス (viewBox 0 0 300 300) */
export function shapeOf(id: number): string {
  return (shapes as Record<string, string>)[String(id)] ?? '';
}

type QuestionData = Omit<KnowledgeQuestion, 'grade'>;

// 問題は学年ごとのファイルに分けてある。ファイルの学年を grade としてつける
const FILES: Record<Grade, QuestionData[]> = { 1: grade1, 2: grade2, 3: grade3, 4: grade4, 5: grade5, 6: grade6 };

/** ちしき問題 (全学年) */
export const QUESTIONS: readonly KnowledgeQuestion[] = (Object.entries(FILES) as [string, QuestionData[]][]).flatMap(
  ([grade, list]) => list.map((q) => ({ ...q, grade: Number(grade) as Grade })),
);
