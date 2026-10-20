<!-- クイズ画面: 1問ずつ出して、30秒のタイマーで答えを受けつける -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { makeOptions, POINTS_PER_QUESTION, showsKana, similarCountFor, TIME_LIMIT } from '../core/quiz';
import { sound } from '../core/sound';
import type { AnswerRecord, Prefecture, Quiz } from '../types';
import QuestionCard from './QuestionCard.vue';
import TimerBar from './TimerBar.vue';

const props = defineProps<{ quiz: Quiz }>();
const emit = defineEmits<{ finish: [answers: AnswerRecord[]] }>();

const NEXT_DELAY = 2000; // 答えたあと、解説を読む時間 (ミリ秒)
const TICK_FROM = 5; // のこり何秒からカウントダウンの音を鳴らすか

const MODE_BADGES = { silhouette: '🗺️ シルエット', knowledge: '💡 ちしき', mix: '🌟 ミックス' } as const;

const index = ref(0);
const answers = ref<AnswerRecord[]>([]);
const timeLeft = ref(TIME_LIMIT);
/** 今の問題に答えた (または時間切れになった) あと */
const answered = ref(false);
const selected = ref<Prefecture | null>(null);

const item = computed(() => props.quiz.items[index.value]);
const options = computed(() => makeOptions(item.value, similarCountFor(props.quiz.mode, props.quiz.grade)));
const score = computed(() => answers.value.filter((a) => a.correct).length * POINTS_PER_QUESTION);
const badge = computed(() =>
  props.quiz.mode === 'daily' ? `📅 今日のチャレンジ（${props.quiz.grade}年生）` : MODE_BADGES[props.quiz.mode],
);
const kana = computed(() => showsKana(props.quiz));

let timer: ReturnType<typeof setInterval> | undefined;
let nextTimeout: ReturnType<typeof setTimeout> | undefined;

function startTimer() {
  clearInterval(timer);
  timeLeft.value = TIME_LIMIT;
  timer = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value > 0 && timeLeft.value <= TICK_FROM) sound.tick();
    if (timeLeft.value <= 0) answer(null);
  }, 1000);
}

/** pref が null なら時間切れ */
function answer(pref: Prefecture | null) {
  if (answered.value) return;
  clearInterval(timer);
  answered.value = true;
  selected.value = pref;
  const correct = pref?.id === item.value.answer.id;
  if (correct) sound.correct();
  else sound.wrong();
  answers.value.push({ item: item.value, selected: pref, correct });
  nextTimeout = setTimeout(next, NEXT_DELAY);
}

function next() {
  if (index.value + 1 >= props.quiz.items.length) {
    emit('finish', answers.value);
    return;
  }
  index.value++;
  answered.value = false;
  selected.value = null;
  startTimer();
}

const isCorrectOption = (p: Prefecture) => answered.value && p.id === item.value.answer.id;
const isWrongOption = (p: Prefecture) => answered.value && p.id === selected.value?.id && p.id !== item.value.answer.id;

onMounted(startTimer);
onBeforeUnmount(() => {
  clearInterval(timer);
  clearTimeout(nextTimeout);
});
</script>

<template>
  <section class="card screen active">
    <div class="quiz-info-bar">
      <div class="progress-badge">もんだい {{ index + 1 }} / {{ quiz.items.length }}</div>
      <div class="mode-type-badge">{{ badge }}</div>
      <div class="score-badge">てんすう: {{ score }} 点</div>
    </div>

    <TimerBar :left="timeLeft" :limit="TIME_LIMIT" />

    <div class="question-box">
      <QuestionCard :item="item" :revealed="answered" />
    </div>

    <!-- 問題が変わるたびにボタンを作りなおす (前の問題のフォーカスやホバーが残らないように) -->
    <div :key="index" class="options-grid">
      <button
        v-for="p in options"
        :key="p.id"
        type="button"
        class="btn option-btn"
        :class="{ correct: isCorrectOption(p), wrong: isWrongOption(p) }"
        :disabled="answered"
        @click="answer(p)"
      >
        <span class="option-name">
          <ruby v-if="kana">{{ p.name }}<rt>{{ p.kana }}</rt></ruby>
          <template v-else>{{ p.name }}</template>
        </span>
      </button>
    </div>
  </section>
</template>
