<!-- 問題の表示: シルエット (都道府県の形) か、ちしき問題の文章 -->
<script setup lang="ts">
import { shapeOf } from '../data';
import type { QuizItem } from '../types';

defineProps<{ item: QuizItem; revealed: boolean }>();
</script>

<template>
  <div v-if="item.type === 'silhouette'" class="silhouette-card">
    <div class="silhouette-svg-wrapper" :class="{ revealed }">
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="都道府県のシルエット">
        <path fill-rule="evenodd" :d="shapeOf(item.answer.id)" />
      </svg>
    </div>
  </div>
  <div v-else class="knowledge-card">
    <span class="knowledge-category">🏷️ {{ item.question.category }}</span>
    <p class="knowledge-text">{{ item.question.question }}</p>
    <div v-if="revealed" class="knowledge-explanation">💡 {{ item.question.explanation }}</div>
  </div>
</template>
