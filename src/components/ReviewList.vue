<!-- 結果画面の「ふりかえり」: 出題された問題と正解・きみの答え -->
<script setup lang="ts">
import type { AnswerRecord } from '../types';

defineProps<{ answers: AnswerRecord[] }>();
</script>

<template>
  <div class="review-list">
    <div
      v-for="(a, i) in answers"
      :key="i"
      class="review-item"
      :class="a.correct ? 'is-correct' : 'is-wrong'"
    >
      <div class="review-item-header">
        <div class="review-pref">
          <span class="review-status">{{ a.correct ? '⭕' : '❌' }}</span>
          <span>
            問{{ i + 1 }}:
            <template v-if="a.item.type === 'silhouette'">
              【シルエット】正解: <strong>{{ a.item.answer.name }}</strong> ({{ a.item.answer.kana }})
            </template>
            <template v-else>
              【ちしき】{{ a.item.question.question }} ➔ 正解: <strong>{{ a.item.answer.name }}</strong>
            </template>
            <span v-if="!a.selected" class="review-mistake"> (じかんぎれ)</span>
            <span v-else-if="!a.correct" class="review-mistake"> [きみの解答: {{ a.selected.name }}]</span>
          </span>
        </div>
      </div>
      <div class="review-explanation-text">
        💡
        <template v-if="a.item.type === 'silhouette'">地方: {{ a.item.answer.region }} | {{ a.item.answer.hint }}</template>
        <template v-else>{{ a.item.question.explanation }}</template>
      </div>
    </div>
  </div>
</template>
