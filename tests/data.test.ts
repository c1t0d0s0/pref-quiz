// 問題データと都道府県データのチェック
import { describe, expect, it } from 'vitest';
import { PREFECTURES, QUESTIONS, shapeOf, SIMILAR } from '../src/data';
import { GRADES } from '../src/types';

const MIN_PER_GRADE = 100;
const REQUIRED = ['id', 'prefId', 'prefName', 'category', 'question', 'explanation'] as const;

describe('都道府県データ', () => {
  it('47都道府県が id 1〜47 の順にある', () => {
    expect(PREFECTURES.map((p) => p.id)).toEqual(Array.from({ length: 47 }, (_, i) => i + 1));
  });

  it('すべての都道府県にシルエットがある', () => {
    for (const p of PREFECTURES) expect(shapeOf(p.id), p.name).toMatch(/^M/);
  });

  it('形が似ている都道府県の名前は、実在する都道府県', () => {
    const names = new Set(PREFECTURES.map((p) => p.name));
    for (const [id, list] of Object.entries(SIMILAR)) {
      for (const name of list) expect(names.has(name), `${id}: ${name}`).toBe(true);
    }
  });
});

describe('ちしき問題', () => {
  it('必要な項目がそろっている', () => {
    for (const q of QUESTIONS) {
      for (const key of REQUIRED) expect(q[key], `id ${q.id} の ${key}`).toBeTruthy();
    }
  });

  it('id が重複していない', () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('prefId と prefName が合っている', () => {
    const names = new Map(PREFECTURES.map((p) => [p.id, p.name]));
    for (const q of QUESTIONS) expect(q.prefName, `id ${q.id}`).toBe(names.get(q.prefId));
  });

  it.each(GRADES)(`%i年生の問題が ${MIN_PER_GRADE} 問以上ある`, (grade) => {
    expect(QUESTIONS.filter((q) => q.grade === grade).length).toBeGreaterThanOrEqual(MIN_PER_GRADE);
  });
});
