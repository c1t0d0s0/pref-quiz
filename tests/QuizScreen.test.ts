// クイズ画面: 答える → 正解・まちがいの表示 → 次の問題 → さいごに finish
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import QuizScreen from '../src/components/QuizScreen.vue';
import { mulberry32 } from '../src/core/rng';
import { buildQuiz, TIME_LIMIT } from '../src/core/quiz';
import { sound } from '../src/core/sound';
import { QUESTIONS } from '../src/data';
import type { AnswerRecord } from '../src/types';

beforeEach(() => {
  vi.useFakeTimers();
  sound.enabled = false; // jsdom には Web Audio がない
});
afterEach(() => vi.useRealTimers());

const mountQuiz = (mode: 'daily' | 'knowledge', grade: 1 | 3 = 3) =>
  mount(QuizScreen, { props: { quiz: buildQuiz(mode, QUESTIONS, grade, '2026-10-20', mulberry32(1)) } });

describe('QuizScreen', () => {
  it('正解をえらぶと正解の色になり、2秒後に次の問題へ進む', async () => {
    const wrapper = mountQuiz('knowledge');
    const answer = (wrapper.props('quiz').items[0]).answer.name;
    const button = wrapper.findAll('.option-btn').find((b) => b.text() === answer)!;
    await button.trigger('click');
    expect(button.classes()).toContain('correct');
    expect(wrapper.find('.score-badge').text()).toContain('10 点');
    expect(wrapper.find('.knowledge-explanation').exists()).toBe(true);
    await vi.advanceTimersByTimeAsync(2000);
    expect(wrapper.find('.progress-badge').text()).toContain('2 / 10');
  });

  it('まちがえると、えらんだボタンと正解のボタンに色がつく', async () => {
    const wrapper = mountQuiz('knowledge');
    const answer = wrapper.props('quiz').items[0].answer.name;
    const wrong = wrapper.findAll('.option-btn').find((b) => b.text() !== answer)!;
    await wrong.trigger('click');
    expect(wrong.classes()).toContain('wrong');
    expect(wrapper.findAll('.option-btn.correct').map((b) => b.text())).toEqual([answer]);
    expect(wrapper.findAll('.option-btn').every((b) => b.attributes('disabled') !== undefined)).toBe(true);
  });

  it('時間切れになると、答えなかったことにして進む', async () => {
    const wrapper = mountQuiz('knowledge');
    await vi.advanceTimersByTimeAsync(TIME_LIMIT * 1000);
    expect(wrapper.find('.option-btn.correct').exists()).toBe(true);
    await vi.advanceTimersByTimeAsync(2000);
    expect(wrapper.find('.progress-badge').text()).toContain('2 / 10');
  });

  it('10問答えると finish に答えの記録をわたす', async () => {
    const wrapper = mountQuiz('daily');
    for (let i = 0; i < 10; i++) {
      await wrapper.findAll('.option-btn')[0].trigger('click');
      await vi.advanceTimersByTimeAsync(2000);
    }
    const [answers] = wrapper.emitted('finish')![0] as [AnswerRecord[]];
    expect(answers).toHaveLength(10);
  });

  it('今日のチャレンジの1年生は、選択肢にふりがながつく', () => {
    expect(mountQuiz('daily', 1).findAll('.option-btn rt')).toHaveLength(4);
    expect(mountQuiz('daily', 3).findAll('.option-btn rt')).toHaveLength(0);
  });
});
