// 都道府県カード
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import CardScreen from '../src/components/cards/CardScreen.vue';
import ResultScreen from '../src/components/ResultScreen.vue';
import { addAnswers, newCards, ownedCards, type CardRecord } from '../src/core/cards';
import { loadCardRecord, saveCardRecord } from '../src/core/storage';
import { prefectureById, QUESTIONS } from '../src/data';
import type { AnswerRecord, Grade } from '../src/types';

const silhouette = (prefId: number, correct = true): AnswerRecord => {
  const answer = prefectureById(prefId);
  return { item: { type: 'silhouette', answer }, selected: correct ? answer : null, correct };
};

const knowledge = (prefId: number, grade: Grade, correct = true): AnswerRecord => {
  const question = QUESTIONS.find((q) => q.prefId === prefId && q.grade === grade)!;
  const answer = prefectureById(prefId);
  return { item: { type: 'knowledge', answer, question }, selected: correct ? answer : null, correct };
};

describe('カードをもらう決まり', () => {
  it('同じ都道府県の シルエットと ちしきの両方に正解すると、カードになる', () => {
    const record = addAnswers({}, [silhouette(13), knowledge(13, 3), silhouette(1), knowledge(2, 3)], 3);
    expect(ownedCards(record[3])).toEqual([13]);
    expect(record[3]).toEqual({ silhouette: [1, 13], knowledge: [2, 13] });
  });

  it('まちがえた問題は数えない', () => {
    const record = addAnswers({}, [silhouette(13), knowledge(13, 3, false)], 3);
    expect(ownedCards(record[3])).toEqual([]);
  });

  it('べつべつの クイズで正解しても カードになる', () => {
    const first = addAnswers({}, [silhouette(26)], 4);
    const second = addAnswers(first, [knowledge(26, 4)], 4);
    expect(newCards(first, second)).toEqual([{ grade: 4, prefId: 26 }]);
    // もう持っているカードは、新しくもらったことにならない
    expect(newCards(second, addAnswers(second, [silhouette(26), knowledge(26, 4)], 4))).toEqual([]);
  });

  it('ちしき問題は ほかの学年の問題でも、えらんでいる学年の カードに近づく (じゆうに あそぶ だけでも集まる)', () => {
    const record = addAnswers({}, [silhouette(47), knowledge(47, 6)], 2);
    expect(record[2]).toEqual({ silhouette: [47], knowledge: [47] });
    expect(record[6]).toBeUndefined();
    expect(ownedCards(record[2])).toEqual([47]);
  });

  it('もとの記録は書きかえない', () => {
    const before: CardRecord = { 3: { silhouette: [1], knowledge: [] } };
    addAnswers(before, [knowledge(1, 3)], 3);
    expect(before).toEqual({ 3: { silhouette: [1], knowledge: [] } });
  });
});

describe('カードの記録', () => {
  beforeEach(() => localStorage.clear());

  it('保存して読みもどせる。形のくずれたものは読みとばす', () => {
    saveCardRecord({ 3: { silhouette: [1, 13], knowledge: [13] } });
    expect(loadCardRecord()).toEqual({ 3: { silhouette: [1, 13], knowledge: [13] } });
    localStorage.setItem('pref-quiz:cards', JSON.stringify({ 9: { silhouette: [1] }, 2: { silhouette: [0, 5, 'x'], knowledge: 3 } }));
    expect(loadCardRecord()).toEqual({ 2: { silhouette: [5], knowledge: [] } });
  });
});

describe('CardScreen', () => {
  const record: CardRecord = {
    3: { silhouette: [1, 13], knowledge: [13, 47] },
    5: { silhouette: [26], knowledge: [26] },
  };

  it('学年の 47まいの わくに、持っているカードだけ シルエットと名前を出す', () => {
    const wrapper = mount(CardScreen, { props: { grade: 3, record } });
    expect(wrapper.findAll('.pref-card')).toHaveLength(47);
    const owned = wrapper.findAll('.pref-card.is-owned');
    expect(owned).toHaveLength(1);
    expect(owned[0].classes()).toContain('grade-3');
    expect(owned[0].find('.pref-card-art path').exists()).toBe(true);
    expect(owned[0].text()).toContain('東京都');
    expect(wrapper.find('.card-summary').text()).toContain('1 / 47');
    // かた方だけ正解したカードには、正解ずみの しるし
    expect(wrapper.findAll('.pref-card-progress .done')).toHaveLength(2);
  });

  it('学年を切りかえると、その学年の色のカードになる', async () => {
    const wrapper = mount(CardScreen, { props: { grade: 3, record } });
    await wrapper.findAll('.card-grade-select .grade-btn')[4].trigger('click');
    const owned = wrapper.findAll('.pref-card.is-owned');
    expect(owned).toHaveLength(1);
    expect(owned[0].classes()).toContain('grade-5');
    expect(owned[0].text()).toContain('京都府');
  });

  it('もらったばかりのカードの学年から見せる', () => {
    const wrapper = mount(CardScreen, { props: { grade: 3, record, fresh: [{ grade: 5, prefId: 26 }] } });
    expect(wrapper.find('.card-summary').text()).toContain('5年生');
    expect(wrapper.find('.pref-card.is-fresh').text()).toContain('京都府');
  });
});

describe('ResultScreen', () => {
  it('もらったカードを見せる', () => {
    const answers = [silhouette(13), knowledge(13, 3)];
    const wrapper = mount(ResultScreen, { props: { answers, dailyStreak: null, newCards: [{ grade: 3, prefId: 13 }] } });
    expect(wrapper.find('.card-get').text()).toContain('東京都');
    expect(wrapper.find('.card-get .pref-card.grade-3.is-owned').exists()).toBe(true);
  });

  it('カードをもらわなかったときは出さない', () => {
    const wrapper = mount(ResultScreen, { props: { answers: [silhouette(13)], dailyStreak: null, newCards: [] } });
    expect(wrapper.find('.card-get').exists()).toBe(false);
  });
});
