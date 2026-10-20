export type Grade = 1 | 2 | 3 | 4 | 5 | 6;

export const GRADES: readonly Grade[] = [1, 2, 3, 4, 5, 6];

export const isGrade = (v: unknown): v is Grade => GRADES.includes(v as Grade);

export interface Prefecture {
  id: number;
  name: string;
  kana: string;
  region: string;
  capital: string;
  hint: string;
}

/** ちしき問題。答えはいつも都道府県 (prefId) */
export interface KnowledgeQuestion {
  id: number;
  prefId: number;
  prefName: string;
  category: string;
  question: string;
  explanation: string;
  grade: Grade;
}

/** じゆうに あそぶモードと、今日のチャレンジ */
export type Mode = 'silhouette' | 'knowledge' | 'mix' | 'daily';

/** 1問ぶん。answer が正解の都道府県 */
export type QuizItem =
  | { type: 'silhouette'; answer: Prefecture }
  | { type: 'knowledge'; answer: Prefecture; question: KnowledgeQuestion };

export interface Quiz {
  mode: Mode;
  /** 今日のチャレンジの学年 (ほかのモードでも、ふりがな・選択肢のむずかしさに使う) */
  grade: Grade;
  items: QuizItem[];
}

/** 1問ぶんの答え。selected が null なら時間切れ */
export interface AnswerRecord {
  item: QuizItem;
  selected: Prefecture | null;
  correct: boolean;
}
