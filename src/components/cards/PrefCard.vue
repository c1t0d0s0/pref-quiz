<!-- 都道府県カード1枚: 学年の色の わくの中に、都道府県のシルエット。まだ持っていないカードは うらがえし -->
<script setup lang="ts">
import { computed } from 'vue';
import { prefectureById, shapeOf } from '../../data';
import type { Grade } from '../../types';

const props = defineProps<{
  grade: Grade;
  prefId: number;
  owned: boolean;
  /** まだ持っていないとき: シルエット・ちしきの どちらに正解ずみか */
  silhouette?: boolean;
  knowledge?: boolean;
  /** いま もらったばかり (めくるアニメーションをする) */
  fresh?: boolean;
}>();

const pref = computed(() => prefectureById(props.prefId));
const no = computed(() => String(props.prefId).padStart(2, '0'));
const label = computed(() => {
  if (props.owned) return `${props.grade}年生 No.${no.value} ${pref.value.name}のカード`;
  const done = [props.silhouette && 'シルエット', props.knowledge && 'ちしき'].filter(Boolean).join('と');
  return `${props.grade}年生 No.${no.value} まだ もっていない カード${done ? `（${done}は 正解ずみ）` : ''}`;
});
</script>

<template>
  <div
    class="pref-card"
    :class="[`grade-${grade}`, { 'is-owned': owned, 'is-fresh': fresh }]"
    role="img"
    :aria-label="label"
  >
    <div class="pref-card-head" aria-hidden="true">
      <span class="pref-card-grade">{{ grade }}年</span>
      <span class="pref-card-no">No.{{ no }}</span>
    </div>
    <template v-if="owned">
      <svg class="pref-card-art" viewBox="0 0 300 300" aria-hidden="true">
        <path fill-rule="evenodd" :d="shapeOf(prefId)" />
      </svg>
      <div class="pref-card-name" aria-hidden="true">
        <ruby>{{ pref.name }}<rt>{{ pref.kana }}</rt></ruby>
      </div>
      <div class="pref-card-region" aria-hidden="true">{{ pref.region }}</div>
    </template>
    <template v-else>
      <div class="pref-card-back" aria-hidden="true">？</div>
      <div class="pref-card-progress" aria-hidden="true">
        <span :class="{ done: silhouette }">🗺️{{ silhouette ? '✔' : '' }}</span>
        <span :class="{ done: knowledge }">💡{{ knowledge ? '✔' : '' }}</span>
      </div>
    </template>
  </div>
</template>
