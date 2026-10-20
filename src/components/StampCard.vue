<!-- スタンプカード: 月のカレンダーに、今日のチャレンジをクリアした日のスタンプをならべる -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { streakOf } from '../core/daily';
import { addMonths, firstMonth, monthCalendar, monthOf, stampPrefectureId } from '../core/stamps';
import { prefectureById } from '../data';
import type { Grade } from '../types';
import StampMark from './StampMark.vue';

const props = defineProps<{
  grade: Grade;
  /** この学年でクリアした日 */
  dates: readonly string[];
  today: string;
  /** いま押したばかりのスタンプの日 (押すアニメーションをする) */
  pressed?: string | null;
}>();

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const month = ref(monthOf(props.today));
const calendar = computed(() => monthCalendar(month.value, props.dates, props.today));
const count = computed(() => calendar.value.days.filter((d) => d.stamped).length);
const streak = computed(() => streakOf(props.dates, props.today));
const canPrev = computed(() => month.value > firstMonth(props.dates, props.today));
const canNext = computed(() => month.value < monthOf(props.today));
const monthLabel = computed(() => {
  const [y, m] = month.value.split('-').map(Number);
  return `${y}年 ${m}月`;
});

const dayLabel = (day: { day: number; date: string; stamped: boolean }) =>
  day.stamped ? `${day.day}日 スタンプあり（${prefectureById(stampPrefectureId(day.date)).name}）` : `${day.day}日`;
</script>

<template>
  <div class="stamp-card">
    <div class="stamp-head">
      <button type="button" class="stamp-nav" :disabled="!canPrev" aria-label="前の月" @click="month = addMonths(month, -1)">‹</button>
      <span class="stamp-month">{{ monthLabel }} <span class="stamp-grade">{{ grade }}年生</span></span>
      <button type="button" class="stamp-nav" :disabled="!canNext" aria-label="次の月" @click="month = addMonths(month, 1)">›</button>
    </div>

    <div class="stamp-grid" role="list">
      <span v-for="w in WEEKDAYS" :key="w" class="stamp-weekday" aria-hidden="true">{{ w }}</span>
      <span v-for="i in calendar.leading" :key="`blank-${i}`" aria-hidden="true"></span>
      <span
        v-for="d in calendar.days"
        :key="d.date"
        role="listitem"
        class="stamp-day"
        :class="{ 'is-stamped': d.stamped, 'is-today': d.isToday, 'is-future': d.isFuture, 'is-pressed': d.date === pressed }"
        :aria-label="dayLabel(d)"
      >
        <span class="stamp-num" aria-hidden="true">{{ d.day }}</span>
        <StampMark v-if="d.stamped" :pref-id="stampPrefectureId(d.date)" />
      </span>
    </div>

    <p class="stamp-summary">
      この月の スタンプ <strong>{{ count }}</strong> こ
      <template v-if="streak > 0"> ／ 🔥 {{ streak }}日 れんぞく</template>
    </p>
    <p class="stamp-rule">今日の チャレンジを さいごまで やると、その日に スタンプが おされるよ。スタンプの 絵は 日に よって かわるよ！</p>
  </div>
</template>
