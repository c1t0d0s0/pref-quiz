<!-- 都道府県カードの画面: 学年ごとに、集めたカードを 47まいの わくに ならべる -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { ownedCards, type CardEntry, type CardRecord } from '../../core/cards';
import { PREFECTURES } from '../../data';
import { GRADES, type Grade } from '../../types';
import PrefCard from './PrefCard.vue';

const props = defineProps<{
  grade: Grade;
  record: CardRecord;
  /** いま もらったばかりのカード (結果画面から来たときだけ) */
  fresh?: readonly CardEntry[];
}>();
const emit = defineEmits<{ back: [] }>();

// もらったばかりのカードがあれば、その学年から見せる
const shown = ref<Grade>(props.fresh?.[0]?.grade ?? props.grade);
const progress = computed(() => props.record[shown.value]);
const owned = computed(() => new Set(ownedCards(progress.value)));
const silhouette = computed(() => new Set(progress.value?.silhouette ?? []));
const knowledge = computed(() => new Set(progress.value?.knowledge ?? []));
const isFresh = (prefId: number) => props.fresh?.some((c) => c.grade === shown.value && c.prefId === prefId) ?? false;
const countOf = (g: Grade) => ownedCards(props.record[g]).length;
</script>

<template>
  <section class="card screen active">
    <h2 class="result-title card-screen-title">🎴 都道府県カード</h2>

    <div class="grade-select card-grade-select" role="group" aria-label="学年を えらぶ">
      <button
        v-for="g in GRADES"
        :key="g"
        type="button"
        class="grade-btn"
        :class="[`grade-${g}`, { active: g === shown }]"
        :aria-pressed="g === shown"
        @click="shown = g"
      >
        {{ g }}年
        <span class="card-grade-count">{{ countOf(g) }}</span>
      </button>
    </div>

    <p class="card-summary">
      {{ shown }}年生の カード <strong>{{ owned.size }}</strong> / {{ PREFECTURES.length }} まい
      <template v-if="owned.size === PREFECTURES.length"> 🎉 コンプリート！</template>
    </p>

    <div class="card-grid" role="list">
      <div v-for="p in PREFECTURES" :key="p.id" role="listitem">
        <PrefCard
          :grade="shown"
          :pref-id="p.id"
          :owned="owned.has(p.id)"
          :silhouette="silhouette.has(p.id)"
          :knowledge="knowledge.has(p.id)"
          :fresh="isFresh(p.id)"
        />
      </div>
    </div>

    <p class="stamp-rule card-rule">
      おなじ 都道府県の 🗺️ シルエットと 💡 ちしきの もんだいに、りょうほう 正解すると カードが もらえるよ。
      シルエットは えらんでいる 学年、ちしきは その もんだいの 学年の カードに なるよ。
    </p>

    <div class="result-actions">
      <button type="button" class="btn btn-primary" @click="emit('back')">タイトルへもどる 🏠</button>
    </div>
  </section>
</template>
