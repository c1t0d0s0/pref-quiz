// 問題の組み立てと、4択の選択肢づくり
import { PREFECTURES, prefectureById, SIMILAR } from '../data';
import type { Grade, KnowledgeQuestion, Mode, Prefecture, Quiz, QuizItem } from '../types';
import { dailyQuestions } from './daily';
import { shuffle, type Rng } from './rng';

export const QUIZ_LENGTH = 10;
export const TIME_LIMIT = 30; // 1問の制限時間 (秒)
export const POINTS_PER_QUESTION = 10;
export const OPTION_COUNT = 4;
/** 対戦の選択肢の数 (早押しなので、当てずっぽうで取りにくいよう多めにする) */
export const BATTLE_OPTION_COUNT = 6;

const silhouetteItem = (answer: Prefecture): QuizItem => ({ type: 'silhouette', answer });
const knowledgeItem = (question: KnowledgeQuestion): QuizItem => ({
  type: 'knowledge',
  answer: prefectureById(question.prefId),
  question,
});

/** モードに合わせて10問を作る。今日のチャレンジは date と grade で決まり、ほかは毎回ランダム */
export function buildQuiz(
  mode: Mode,
  questions: readonly KnowledgeQuestion[],
  grade: Grade,
  date: string,
  rng: Rng = Math.random,
): Quiz {
  let items: QuizItem[];
  switch (mode) {
    case 'daily':
      items = dailyQuestions(questions, grade, date).map(knowledgeItem);
      break;
    case 'silhouette':
      items = shuffle(PREFECTURES, rng).slice(0, QUIZ_LENGTH).map(silhouetteItem);
      break;
    case 'knowledge':
      items = shuffle(questions, rng).slice(0, QUIZ_LENGTH).map(knowledgeItem);
      break;
    case 'mix': {
      // シルエット5問 + ちしき5問
      const half = QUIZ_LENGTH / 2;
      const silhouettes = shuffle(PREFECTURES, rng).slice(0, half).map(silhouetteItem);
      const knowledge = shuffle(questions, rng).slice(0, QUIZ_LENGTH - half).map(knowledgeItem);
      items = shuffle([...silhouettes, ...knowledge], rng);
      break;
    }
  }
  return { mode, grade, items };
}

/** 選択肢に入れる「形が似ている都道府県」の数。今日のチャレンジは低学年ほど少なくして、やさしくする */
export function similarCountFor(mode: Mode, grade: Grade): number {
  if (mode !== 'daily') return 2;
  if (grade <= 2) return 0;
  if (grade <= 4) return 1;
  return 2;
}

/** 今日のチャレンジの1・2年生は、選択肢の都道府県名にふりがなをつける */
export const showsKana = (quiz: Quiz): boolean => quiz.mode === 'daily' && quiz.grade <= 2;

/**
 * 正解1つと、まちがい (count - 1) 個の選択肢。まちがいには形が似ている都道府県を similarCount 個まで優先して入れる。
 * 「秋田県と どこ？」のように問題文に出てくる都道府県は、答えと紛らわしいので入れない
 */
export function makeOptions(
  item: QuizItem,
  similarCount: number,
  rng: Rng = Math.random,
  count: number = OPTION_COUNT,
): Prefecture[] {
  const answer = item.answer;
  const text = item.type === 'knowledge' ? item.question.question : '';
  const similarNames = SIMILAR[answer.id] ?? [];
  const usable = PREFECTURES.filter((p) => p.id !== answer.id && !text.includes(p.name));
  const similar = shuffle(
    usable.filter((p) => similarNames.includes(p.name)),
    rng,
  ).slice(0, similarCount);
  const others = shuffle(
    usable.filter((p) => !similar.includes(p)),
    rng,
  ).slice(0, count - 1 - similar.length);
  return shuffle([answer, ...similar, ...others], rng);
}

export interface Rank {
  emoji: string;
  title: string;
  message: string;
  /** ファンファーレと紙ふぶきでお祝いする */
  celebrate: boolean;
}

/** 点数 (100点満点) から、結果の称号とメッセージ */
export function rankFor(score: number, maxScore: number): Rank {
  const rate = maxScore > 0 ? score / maxScore : 0;
  if (rate === 1) {
    return { emoji: '👑', title: '神レベル！日本ちずハカセ', message: '全問正解！すごすぎる！きみは完全な都道府県マスターだ！', celebrate: true };
  }
  if (rate >= 0.8) {
    return { emoji: '🌟', title: '都道府県マスター！', message: 'とっても物知り！あともう少しで満点だね！', celebrate: true };
  }
  if (rate >= 0.5) {
    return { emoji: '👍', title: 'ものしり級', message: 'なかなかやるね！もう一度チャレンジして満点を目指そう！', celebrate: false };
  }
  return { emoji: '🎒', title: '見習いチャレンジャー', message: 'がんばったね！いろんな都道府県の形や知識を覚えてみよう！', celebrate: false };
}
