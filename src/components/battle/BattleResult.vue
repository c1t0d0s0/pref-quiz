<!-- たいせん の結果: とった札の多い順 (同じなら おてつきの少ない順)。ホストは「もう一度」で次の回を始められる -->
<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { standings, type Room } from '../../battle/battle';
import { sound } from '../../core/sound';

const props = defineProps<{ room: Room; uid: string; seat: string | null }>();
const emit = defineEmits<{ rematch: [] }>();

const rows = computed(() => standings(props.room));
const isHost = computed(() => props.room.hostUid === props.uid);
const me = computed(() => rows.value.find((row) => row.seat === props.seat) ?? null);

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

onMounted(() => {
  if (me.value?.rank === 1) sound.fanfare();
});
</script>

<template>
  <div class="battle-result">
    <div class="result-header">
      <div class="result-emoji">{{ me?.rank === 1 ? '👑' : '🏁' }}</div>
      <h2 class="result-title">たいせん けっか</h2>
    </div>
    <p v-if="me?.rank === 1" class="daily-result">やったね！ きみが 1位だよ！</p>

    <ol class="battle-standings">
      <li v-for="row in rows" :key="row.seat" class="battle-standing" :class="{ 'is-me': row.seat === seat, 'is-offline': !row.online }">
        <span class="battle-rank">{{ row.rank ? `${MEDALS[row.rank] ?? ''}${row.rank}位` : '―' }}</span>
        <span class="battle-standing-name">{{ row.name }}</span>
        <span class="battle-standing-cards">{{ row.cards }}まい</span>
        <span class="battle-standing-faults">{{ row.online ? `おてつき ${row.faults}` : 'ぬけた' }}</span>
      </li>
    </ol>

    <button v-if="isHost" type="button" class="btn btn-primary battle-main-btn" @click="emit('rematch')">もう一度 たいせん 🔁</button>
    <p v-else class="battle-message">ホストが「もう一度」を おすと、つぎの たいせんが はじまるよ</p>
  </div>
</template>
