<!-- スタンプ1つ: チョークの まるの中に、都道府県のシルエット -->
<script setup lang="ts">
import { shapeOf } from '../data';

defineProps<{ prefId: number }>();
</script>

<template>
  <svg class="stamp-mark" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="44" />
    <svg x="20" y="20" width="60" height="60" viewBox="0 0 300 300">
      <path fill-rule="evenodd" :d="shapeOf(prefId)" />
    </svg>
  </svg>
</template>
