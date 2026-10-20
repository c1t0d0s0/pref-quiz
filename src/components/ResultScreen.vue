<!-- 結果画面: 点数・称号・ふりかえり -->
<script setup lang="ts">
import { computed } from 'vue';
import { POINTS_PER_QUESTION, rankFor } from '../core/quiz';
import type { AnswerRecord } from '../types';
import ReviewList from './ReviewList.vue';

const props = defineProps<{
  answers: AnswerRecord[];
  /** 今日のチャレンジをクリアしたときの連続日数 (今日のチャレンジでなければ null) */
  dailyStreak: number | null;
}>();
const emit = defineEmits<{ restart: []; stamps: [] }>();

const score = computed(() => props.answers.filter((a) => a.correct).length * POINTS_PER_QUESTION);
const maxScore = computed(() => props.answers.length * POINTS_PER_QUESTION);
const rank = computed(() => rankFor(score.value, maxScore.value));
</script>

<template>
  <section class="card screen active">
    <div class="result-header">
      <div class="result-emoji">{{ rank.emoji }}</div>
      <h2 class="result-title">けっかはっぴょう！</h2>
    </div>

    <div class="score-card">
      <div class="score-main">
        <span class="score-num">{{ score }}</span>
        <span class="score-unit">/ {{ maxScore }} 点</span>
      </div>
      <div class="rank-badge">{{ rank.title }}</div>
      <p class="result-message">{{ rank.message }}</p>
      <template v-if="dailyStreak !== null">
        <p class="daily-result">📅 今日のチャレンジ クリア！ 🔥 {{ dailyStreak }}日 れんぞく</p>
        <button type="button" class="stamp-link" @click="emit('stamps')">📒 スタンプを 見に行く</button>
      </template>
    </div>

    <div class="review-container">
      <h3 class="review-title">🔍 ふりかえり（出題された問題）</h3>
      <ReviewList :answers="answers" />
    </div>

    <div class="result-actions">
      <button type="button" class="btn btn-primary" @click="emit('restart')">タイトルへもどる 🏠</button>
    </div>
  </section>
</template>
