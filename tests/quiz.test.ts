// 問題の組み立て・選択肢・称号
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../src/core/rng';
import { BATTLE_OPTION_COUNT, buildQuiz, makeOptions, OPTION_COUNT, QUIZ_LENGTH, rankFor, showsKana, similarCountFor } from '../src/core/quiz';
import { prefectureById, QUESTIONS, SIMILAR } from '../src/data';
import type { QuizItem } from '../src/types';

const rng = () => mulberry32(42);

describe('buildQuiz', () => {
  it.each(['silhouette', 'knowledge', 'mix', 'daily'] as const)('%s は10問', (mode) => {
    const quiz = buildQuiz(mode, QUESTIONS, 3, '2026-10-20', rng());
    expect(quiz.items).toHaveLength(QUIZ_LENGTH);
    expect(new Set(quiz.items.map((i) => (i.type === 'knowledge' ? `q${i.question.id}` : `s${i.answer.id}`))).size).toBe(QUIZ_LENGTH);
  });

  it('ミックスはシルエット5問とちしき5問', () => {
    const quiz = buildQuiz('mix', QUESTIONS, 3, '2026-10-20', rng());
    expect(quiz.items.filter((i) => i.type === 'silhouette')).toHaveLength(5);
    expect(quiz.items.filter((i) => i.type === 'knowledge')).toHaveLength(5);
  });

  it('ちしき問題の正解は、問題の prefId の都道府県', () => {
    for (const item of buildQuiz('knowledge', QUESTIONS, 3, '2026-10-20', rng()).items) {
      if (item.type === 'knowledge') expect(item.answer.id).toBe(item.question.prefId);
    }
  });
});

describe('makeOptions', () => {
  const silhouette = (id: number): QuizItem => ({ type: 'silhouette', answer: prefectureById(id) });

  it('正解をふくむ、ちがう4つの都道府県', () => {
    for (let id = 1; id <= 47; id++) {
      const options = makeOptions(silhouette(id), 2, rng());
      expect(options).toHaveLength(OPTION_COUNT);
      expect(new Set(options.map((p) => p.id)).size).toBe(OPTION_COUNT);
      expect(options.some((p) => p.id === id)).toBe(true);
    }
  });

  it('たいせん では、正解をふくむ、ちがう6つの都道府県', () => {
    for (let id = 1; id <= 47; id++) {
      const options = makeOptions(silhouette(id), 2, rng(), BATTLE_OPTION_COUNT);
      expect(options).toHaveLength(6);
      expect(new Set(options.map((p) => p.id)).size).toBe(6);
      expect(options.some((p) => p.id === id)).toBe(true);
    }
  });

  it('形が似ている都道府県を similarCount 個入れる', () => {
    const similar = SIMILAR[2]; // 青森県
    for (const count of [0, 1, 2]) {
      const options = makeOptions(silhouette(2), count, rng());
      expect(options.filter((p) => similar.includes(p.name))).toHaveLength(count);
    }
  });

  it('問題文に出てくる都道府県は、まちがいの選択肢に入れない', () => {
    const question = QUESTIONS.find((q) => q.question.includes('秋田県と どこ'));
    expect(question).toBeDefined();
    const item: QuizItem = { type: 'knowledge', answer: prefectureById(question!.prefId), question: question! };
    for (let seed = 0; seed < 50; seed++) {
      expect(makeOptions(item, 2, mulberry32(seed)).map((p) => p.name)).not.toContain('秋田県');
    }
  });
});

describe('学年によるむずかしさ', () => {
  it('今日のチャレンジは、低学年ほど形の似た選択肢が少ない', () => {
    expect([1, 2, 3, 4, 5, 6].map((g) => similarCountFor('daily', g as 1))).toEqual([0, 0, 1, 1, 2, 2]);
    expect(similarCountFor('silhouette', 1)).toBe(2);
  });

  it('ふりがなは今日のチャレンジの1・2年生だけ', () => {
    expect(showsKana({ mode: 'daily', grade: 2, items: [] })).toBe(true);
    expect(showsKana({ mode: 'daily', grade: 3, items: [] })).toBe(false);
    expect(showsKana({ mode: 'knowledge', grade: 1, items: [] })).toBe(false);
  });
});

describe('rankFor', () => {
  it.each([
    [100, '👑', true],
    [80, '🌟', true],
    [50, '👍', false],
    [40, '🎒', false],
  ])('%i点 → %s', (score, emoji, celebrate) => {
    expect(rankFor(score, 100)).toMatchObject({ emoji, celebrate });
  });
});
