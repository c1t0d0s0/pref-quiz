<!-- スタンプカードの画面 -->
<script setup lang="ts">
import { computed } from 'vue';
import { stampPrefectureId } from '../core/stamps';
import { prefectureById } from '../data';
import type { Grade } from '../types';
import StampCard from './StampCard.vue';

const props = defineProps<{ grade: Grade; dates: readonly string[]; today: string; pressed: string | null }>();
const emit = defineEmits<{ back: [] }>();

/** 押したばかりのスタンプの都道府県 (今日のチャレンジのあとに来たときだけ) */
const pressedPref = computed(() => (props.pressed ? prefectureById(stampPrefectureId(props.pressed)) : null));
</script>

<template>
  <section class="card screen active">
    <h2 class="result-title stamp-title">📒 スタンプカード</h2>
    <p v-if="pressedPref" class="stamp-pressed-message">
      スタンプを おしたよ！ 今日の スタンプは「{{ pressedPref.name }}」だよ。
    </p>
    <StampCard :grade="grade" :dates="dates" :today="today" :pressed="pressed" />
    <div class="result-actions">
      <button type="button" class="btn btn-primary" @click="emit('back')">タイトルへもどる 🏠</button>
    </div>
  </section>
</template>
