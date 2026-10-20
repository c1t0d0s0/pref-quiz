<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ left: number; limit: number }>();

const WARNING = 5; // のこり何秒から点滅させるか
const percent = computed(() => (props.left / props.limit) * 100);
</script>

<template>
  <div class="timer-container">
    <div class="timer-label">
      <span>⏱️ のこり時間</span>
      <span>{{ left }}秒</span>
    </div>
    <div class="timer-bar-outer">
      <div class="timer-bar-inner" :class="{ warning: left <= WARNING }" :style="{ width: `${percent}%` }"></div>
    </div>
  </div>
</template>
