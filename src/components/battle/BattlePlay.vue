<!--
  たいせん中: カウントダウンのあと、全員に同じシルエットと 6つの選択肢を出す。
  一番早く正解した人が札をとる。まちがえたら おてつきで、その問題はお休み。
  問題が終わったら答えを見せて、ホストの端末が次の問題に進める
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import {
  REVEAL_MS,
  TIME_LIMIT_MS,
  faulted,
  makeGame,
  settled,
  standings,
  takeOf,
  type Room,
} from '../../battle/battle';
import type { BattleNet } from '../../cloud/battle-net';
import { sound } from '../../core/sound';
import type { Prefecture } from '../../types';
import QuestionCard from '../QuestionCard.vue';
import TimerBar from '../TimerBar.vue';

const props = defineProps<{ room: Room; code: string; net: BattleNet }>();

const TICK_MS = 100;
const TICK_FROM = 5; // のこり何秒からカウントダウンの音を鳴らすか
const LIMIT_SEC = TIME_LIMIT_MS / 1000;

// 部屋のデータは、だれかが答えるたびに新しくなる。問題は seed・回・出題数が変わったときだけ作りなおす
const gameKey = computed(() => `${props.room.seed}:${props.room.round}:${props.room.count}`);
const game = computed(() => {
  const [seed, round, count] = gameKey.value.split(':');
  return makeGame(seed, Number(round), Number(count));
});

const now = ref(props.net.serverNow());
const timer = setInterval(() => {
  now.value = props.net.serverNow();
  step();
}, TICK_MS);

const seat = computed(() => props.net.seatIn(props.code));
const isHost = computed(() => props.room.hostUid === props.net.uid);
const q = computed(() => props.room.q ?? 0);
const qAt = computed(() => props.room.qAt ?? props.room.startAt ?? 0);
const countdown = computed(() => Math.ceil(((props.room.startAt ?? 0) - now.value) / 1000));
/**
 * 画面に出している問題。次の問題に進んでから出るまでの間 (答えを見せている間) は、前の問題のまま
 */
const shownQ = computed<number | null>(() => {
  if (countdown.value > 0) return null;
  if (now.value >= qAt.value) return q.value;
  return q.value > 0 ? q.value - 1 : null;
});

/** 答えを見せた問題 (この端末で) */
const revealedQ = ref(-1);
/** ホストだけ: 次に進めた問題 */
let advancedQ = -1;
/** この端末で選んだもの (問題ごと) */
const picked = ref<{ q: number; id: number } | null>(null);
const streak = ref(0);

const revealed = computed(() => shownQ.value !== null && (revealedQ.value >= shownQ.value || shownQ.value < q.value));
const item = computed(() => (shownQ.value === null ? null : game.value.items[shownQ.value]));
const options = computed(() => (shownQ.value === null ? [] : game.value.options[shownQ.value]));
const myPick = computed(() => (picked.value && picked.value.q === shownQ.value ? picked.value.id : null));
const sittingOut = computed(
  () => shownQ.value !== null && (faulted(props.room, shownQ.value, seat.value) || (myPick.value !== null && myPick.value !== item.value?.answer.id)),
);
const locked = computed(() => revealed.value || myPick.value !== null || sittingOut.value);
const left = computed(() =>
  shownQ.value === null ? LIMIT_SEC : Math.min(LIMIT_SEC, Math.max(0, Math.ceil((qAt.value + TIME_LIMIT_MS - now.value) / 1000))),
);
const rows = computed(() => standings(props.room));

const feedback = computed<{ text: string; tone: '' | 'correct' | 'incorrect' }>(() => {
  if (shownQ.value === null) return { text: 'シルエットを よく 見てね！', tone: '' };
  if (revealed.value) {
    const take = takeOf(props.room, shownQ.value);
    if (take && take.seat === seat.value) return { text: streak.value >= 2 ? `とった！ ${streak.value}れんぞく！` : 'とった！', tone: 'correct' };
    if (take) return { text: `${props.room.players[take.seat]?.name ?? 'だれか'}さんが とった！`, tone: 'incorrect' };
    return { text: 'だれも とれなかった…', tone: 'incorrect' };
  }
  if (sittingOut.value) return { text: 'おてつき！ この問題は お休み', tone: 'incorrect' };
  return { text: '', tone: '' };
});

/** 問題が終わったか (だれかがとった・全員おてつき・時間切れ) を見て、答えを見せる。ホストは次に進める */
function step() {
  const cur = q.value;
  if (props.room.status !== 'playing' || shownQ.value !== cur) return;
  if (revealedQ.value < cur && (settled(props.room, cur) || now.value >= qAt.value + TIME_LIMIT_MS)) {
    revealedQ.value = cur;
    const take = takeOf(props.room, cur);
    if (take && take.seat === seat.value) {
      streak.value++;
      sound.correct();
    } else {
      streak.value = 0;
    }
  }
  if (isHost.value && revealedQ.value === cur && advancedQ !== cur) {
    advancedQ = cur;
    if (cur + 1 < game.value.items.length) {
      props.net.advance(props.code, cur + 1).catch((err) => console.error(err));
    } else {
      setTimeout(() => props.net.end(props.code).catch((err) => console.error(err)), REVEAL_MS);
    }
  }
}

function choose(pref: Prefecture) {
  const cur = shownQ.value;
  if (cur === null || cur !== q.value || locked.value || !item.value) return;
  picked.value = { q: cur, id: pref.id };
  if (pref.id === item.value.answer.id) {
    props.net.take(props.code, props.room.round, cur).catch((err) => console.error(err));
  } else {
    sound.wrong();
    void props.net.fault(props.code, cur);
  }
}

// のこり5秒からカウントダウンの音
watch(left, (sec) => {
  if (sec > 0 && sec <= TICK_FROM && !locked.value) sound.tick();
});

// 部屋のデータが変わったときも、すぐに確かめる (100ms を待たずに)
watch(() => props.room, step);

const isAnswer = (p: Prefecture) => revealed.value && p.id === item.value?.answer.id;
const isWrong = (p: Prefecture) => myPick.value === p.id && p.id !== item.value?.answer.id;
const isPicked = (p: Prefecture) => !revealed.value && myPick.value === p.id && p.id === item.value?.answer.id;

onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div class="battle-play">
    <div class="quiz-info-bar">
      <div class="progress-badge">
        <template v-if="shownQ === null">じゅんび</template>
        <template v-else>もんだい {{ shownQ + 1 }} / {{ game.items.length }}</template>
      </div>
      <div class="mode-type-badge">⚔️ たいせん</div>
    </div>

    <ol class="battle-scores" aria-label="とった札">
      <li v-for="row in rows" :key="row.seat" class="battle-score" :class="{ 'is-me': row.seat === seat, 'is-offline': !row.online }">
        <span class="battle-score-name">{{ row.name }}</span>
        <b class="battle-score-num">{{ row.cards }}</b>
      </li>
    </ol>

    <TimerBar :left="left" :limit="LIMIT_SEC" />

    <div class="question-box">
      <div v-if="shownQ === null" class="silhouette-card battle-countdown">
        <span class="battle-countdown-num">{{ Math.max(countdown, 1) }}</span>
      </div>
      <QuestionCard v-else-if="item" :item="item" :revealed="revealed" />
    </div>

    <p class="battle-feedback" :class="feedback.tone" role="status">{{ feedback.text }}</p>

    <!-- 問題が変わるたびにボタンを作りなおす (前の問題のフォーカスやホバーが残らないように) -->
    <div :key="shownQ ?? 'ready'" class="options-grid is-six">
      <button
        v-for="p in options"
        :key="p.id"
        type="button"
        class="btn option-btn"
        :class="{ correct: isAnswer(p), wrong: isWrong(p), 'is-picked': isPicked(p) }"
        :disabled="locked"
        @click="choose(p)"
      >
        <span class="option-name">{{ p.name }}</span>
      </button>
    </div>
  </div>
</template>
