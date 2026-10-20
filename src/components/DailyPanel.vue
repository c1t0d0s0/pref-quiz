<!-- 今日のチャレンジ: 学年をえらんで、その学年の今日の10問に挑戦する -->
<script setup lang="ts">
import { computed } from 'vue';
import { monthDay } from '../core/date';
import { streakOf } from '../core/daily';
import type { DailyRecord } from '../core/storage';
import { GRADES, type Grade } from '../types';

const props = defineProps<{ grade: Grade; record: DailyRecord; today: string }>();
const emit = defineEmits<{ 'update:grade': [grade: Grade]; start: []; stamps: [] }>();

const dates = computed(() => props.record[props.grade] ?? []);
const done = computed(() => dates.value.includes(props.today));
const streak = computed(() => streakOf(dates.value, props.today));
const status = computed(() => {
  const text = done.value ? '✔ クリアずみ' : 'まだ ちょうせん していないよ';
  return streak.value > 0 ? `${text} ／ 🔥 ${streak.value}日 れんぞく` : text;
});
</script>

<template>
  <div class="daily-panel">
    <div class="daily-head">
      <span class="daily-title">📅 今日の チャレンジ</span>
      <span class="daily-date">{{ monthDay(today) }}</span>
    </div>
    <div class="grade-select" role="group" aria-label="学年を えらぶ">
      <button
        v-for="g in GRADES"
        :key="g"
        type="button"
        class="grade-btn"
        :class="{ active: g === grade }"
        :aria-pressed="g === grade"
        @click="emit('update:grade', g)"
      >
        {{ g }}年
      </button>
    </div>
    <p class="daily-status" :class="{ 'is-done': done }">{{ status }}</p>
    <button type="button" class="btn btn-primary daily-start-btn" @click="emit('start')">
      <span>ちょうせん する！</span> ✏️
    </button>
    <button type="button" class="stamp-link" @click="emit('stamps')">📒 スタンプカードを 見る</button>
  </div>
</template>
