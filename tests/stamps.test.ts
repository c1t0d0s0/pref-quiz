// スタンプカード
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import StampCard from '../src/components/StampCard.vue';
import { addMonths, firstMonth, monthCalendar, stampPrefectureId } from '../src/core/stamps';
import { loadDailyRecord, recordDailyClear } from '../src/core/storage';
import { addDays } from '../src/core/date';

describe('monthCalendar', () => {
  it('2026年10月は木曜はじまりの31日', () => {
    const cal = monthCalendar('2026-10', [], '2026-10-20');
    expect(cal.leading).toBe(4);
    expect(cal.days).toHaveLength(31);
  });

  it('うるう年の2月は29日', () => {
    expect(monthCalendar('2028-02', [], '2028-02-01').days).toHaveLength(29);
    expect(monthCalendar('2027-02', [], '2027-02-01').days).toHaveLength(28);
  });

  it('クリアした日・今日・これからの日がわかる', () => {
    const cal = monthCalendar('2026-10', ['2026-10-18', '2026-10-20', '2026-11-01'], '2026-10-20');
    expect(cal.days.filter((d) => d.stamped).map((d) => d.day)).toEqual([18, 20]);
    expect(cal.days.find((d) => d.isToday)?.day).toBe(20);
    expect(cal.days.filter((d) => d.isFuture)).toHaveLength(11);
  });
});

describe('月の移動', () => {
  it('年をまたいで月を足し引きできる', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2027-01', -1)).toBe('2026-12');
  });

  it('いちばん古いスタンプの月までさかのぼれる', () => {
    expect(firstMonth(['2026-11-03', '2026-10-25'], '2027-01-10')).toBe('2026-10');
    expect(firstMonth([], '2027-01-10')).toBe('2027-01');
  });
});

describe('stampPrefectureId', () => {
  it('日付で決まる 1〜47 の都道府県で、日によって変わる', () => {
    const ids = Array.from({ length: 60 }, (_, i) => stampPrefectureId(addDays('2026-10-01', i)));
    expect(ids.every((id) => id >= 1 && id <= 47)).toBe(true);
    expect(stampPrefectureId('2026-10-20')).toBe(stampPrefectureId('2026-10-20'));
    expect(new Set(ids).size).toBeGreaterThan(20);
  });
});

describe('StampCard', () => {
  const mountCard = (dates: string[]) =>
    mount(StampCard, { props: { grade: 3, dates, today: '2026-10-20', pressed: '2026-10-20' } });

  it('クリアした日にスタンプが押される', () => {
    const wrapper = mountCard(['2026-10-18', '2026-10-19', '2026-10-20']);
    expect(wrapper.findAll('.stamp-day.is-stamped .stamp-mark')).toHaveLength(3);
    expect(wrapper.find('.stamp-summary').text()).toContain('3');
    expect(wrapper.find('.stamp-summary').text()).toContain('3日 れんぞく');
    expect(wrapper.find('.stamp-day.is-pressed').exists()).toBe(true);
  });

  it('前の月にもどって、その月のスタンプを見られる', async () => {
    const wrapper = mountCard(['2026-09-30', '2026-10-01']);
    const [prev, next] = wrapper.findAll('.stamp-nav');
    expect(next.attributes('disabled')).toBeDefined(); // 来月へは行けない
    await prev.trigger('click');
    expect(wrapper.find('.stamp-month').text()).toContain('2026年 9月');
    expect(wrapper.findAll('.stamp-day.is-stamped')).toHaveLength(1);
    expect(wrapper.findAll('.stamp-nav')[0].attributes('disabled')).toBeDefined(); // それより前はない
  });
});

describe('クリアした日の記録', () => {
  beforeEach(() => localStorage.clear());

  it('1年ぶん以上を残しておく (スタンプカードでさかのぼれるように)', () => {
    for (let i = 0; i < 400; i++) recordDailyClear(3, addDays('2026-10-01', i));
    const dates = loadDailyRecord()[3] ?? [];
    expect(dates).toHaveLength(400);
    recordDailyClear(3, addDays('2026-10-01', 400));
    expect(loadDailyRecord()[3]).toHaveLength(400);
    expect(loadDailyRecord()[3]?.[0]).toBe('2026-10-02');
  });
});
