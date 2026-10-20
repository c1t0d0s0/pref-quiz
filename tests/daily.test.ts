// 今日のチャレンジの出題
import { describe, expect, it } from 'vitest';
import { DAILY_LENGTH, dailyQuestions, streakOf } from '../src/core/daily';
import { addDays, dayIndex } from '../src/core/date';
import { QUESTIONS } from '../src/data';
import { GRADES } from '../src/types';

const START = '2026-10-01'; // dayIndex の 0 日目
const DAYS = 365;
const ids = (grade: (typeof GRADES)[number], date: string) => dailyQuestions(QUESTIONS, grade, date).map((q) => q.id);

describe.each(GRADES)('%i年生', (grade) => {
  const size = QUESTIONS.filter((q) => q.grade === grade).length;

  it('毎日、その学年のちがう問題が10問出る', () => {
    for (let i = 0; i < DAYS; i++) {
      const picked = dailyQuestions(QUESTIONS, grade, addDays(START, i));
      expect(picked).toHaveLength(DAILY_LENGTH);
      expect(new Set(picked.map((q) => q.id)).size).toBe(DAILY_LENGTH);
      expect(picked.every((q) => q.grade === grade)).toBe(true);
    }
  });

  it('同じ日なら同じ問題になる', () => {
    expect(ids(grade, '2026-11-03')).toEqual(ids(grade, '2026-11-03'));
  });

  it('同じ問題がまた出るまでに、少なくとも問題数の半分ぶんの日数があく', () => {
    const minGapDays = Math.floor(Math.floor(size / 2) / DAILY_LENGTH);
    const lastSeen = new Map<number, number>();
    for (let i = 0; i < DAYS; i++) {
      for (const id of ids(grade, addDays(START, i))) {
        const last = lastSeen.get(id);
        if (last !== undefined) expect(i - last, `id ${id}`).toBeGreaterThanOrEqual(minGapDays);
        lastSeen.set(id, i);
      }
    }
  });

  it('一めぐりの始まりの日から (問題数 ÷ 10) 日の間は、全部ちがう問題が出る', () => {
    let day = dayIndex(START);
    while ((day * DAILY_LENGTH) % size !== 0) day++;
    const cycleStart = addDays(START, day - dayIndex(START));
    const round = Array.from({ length: Math.floor(size / DAILY_LENGTH) }, (_, i) => ids(grade, addDays(cycleStart, i))).flat();
    expect(new Set(round).size).toBe(round.length);
  });

  it('1日の中で答えの都道府県が重なる日は、ほとんどない', () => {
    let samePrefDays = 0;
    for (let i = 0; i < DAYS; i++) {
      const picked = dailyQuestions(QUESTIONS, grade, addDays(START, i));
      if (new Set(picked.map((q) => q.prefId)).size !== picked.length) samePrefDays++;
    }
    expect(samePrefDays).toBeLessThanOrEqual(DAYS * 0.02);
  });
});

describe('streakOf', () => {
  it.each([
    [['2026-10-18', '2026-10-19', '2026-10-20'], 3],
    [['2026-10-18', '2026-10-19'], 2], // 今日はまだでも、昨日までの連続を数える
    [['2026-10-17', '2026-10-19', '2026-10-20'], 2],
    [['2026-10-18'], 0],
    [[], 0],
  ])('%j → %i日', (dates, expected) => {
    expect(streakOf(dates, '2026-10-20')).toBe(expected);
  });
});
