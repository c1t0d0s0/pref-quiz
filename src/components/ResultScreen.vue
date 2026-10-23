<!-- 結果画面: 点数・称号・ふりかえり -->
<script setup lang="ts">
import { computed } from 'vue';
import type { CardEntry } from '../core/cards';
import { POINTS_PER_QUESTION, rankFor } from '../core/quiz';
import { prefectureById } from '../data';
import type { AnswerRecord } from '../types';
import PrefCard from './cards/PrefCard.vue';
import ReviewList from './ReviewList.vue';

const props = defineProps<{
  answers: AnswerRecord[];
  /** 今日のチャレンジをクリアしたときの連続日数 (今日のチャレンジでなければ null) */
  dailyStreak: number | null;
  /** このクイズで もらった都道府県カード */
  newCards: readonly CardEntry[];
}>();
const emit = defineEmits<{ restart: []; stamps: []; cards: [] }>();

const score = computed(() => props.answers.filter((a) => a.correct).length * POINTS_PER_QUESTION);
const maxScore = computed(() => props.answers.length * POINTS_PER_QUESTION);
const rank = computed(() => rankFor(score.value, maxScore.value));
const newCardNames = computed(() => props.newCards.map((c) => prefectureById(c.prefId).name).join('・'));
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

    <div v-if="newCards.length > 0" class="card-get">
      <h3 class="card-get-title">🎴 カード ゲット！</h3>
      <p class="card-get-message">「{{ newCardNames }}」の カードを もらったよ！</p>
      <div class="card-get-list">
        <PrefCard v-for="c in newCards" :key="`${c.grade}-${c.prefId}`" :grade="c.grade" :pref-id="c.prefId" owned fresh />
      </div>
      <button type="button" class="stamp-link" @click="emit('cards')">🎴 カードを 見に行く</button>
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
