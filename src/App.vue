<!-- 画面の切りかえ (スタート → クイズ → 結果、スタンプカード) と、学年・今日のチャレンジの記録 -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import AccountBox from './components/AccountBox.vue';
import StartScreen from './components/StartScreen.vue';
import QuizScreen from './components/QuizScreen.vue';
import ResultScreen from './components/ResultScreen.vue';
import StampScreen from './components/StampScreen.vue';
import { cloudAvailable, getSync, startCloud } from './cloud';
import type { SyncStatus } from './cloud/sync';
import { startConfetti } from './core/confetti';
import { streakOf } from './core/daily';
import { jstDate } from './core/date';
import { buildQuiz, POINTS_PER_QUESTION, rankFor } from './core/quiz';
import { sound } from './core/sound';
import { loadDailyRecord, loadGrade, recordDailyClear, saveGrade } from './core/storage';
import { QUESTIONS } from './data';
import type { AnswerRecord, Grade, Mode, Quiz } from './types';

type Screen = 'start' | 'quiz' | 'result' | 'stamps';

const screen = ref<Screen>('start');
const grade = ref<Grade>(loadGrade());
const record = ref(loadDailyRecord());
const today = ref(jstDate());
const quiz = ref<Quiz | null>(null);
const answers = ref<AnswerRecord[]>([]);
const dailyStreak = ref<number | null>(null);
/** いま押したばかりのスタンプの日 (今日のチャレンジの結果からスタンプカードを開いたときだけ) */
const pressedStamp = ref<string | null>(null);
const soundOn = ref(sound.enabled);
/** ログインと保存の状態 (Firebase の設定がないビルドでは使わない) */
const cloudStatus = ref<SyncStatus>('loading');
const confettiCanvas = useTemplateRef<HTMLCanvasElement>('confetti');
let stopConfetti = () => {};

function setGrade(g: Grade) {
  grade.value = g;
  saveGrade(g);
}

function start(mode: Mode) {
  sound.init();
  today.value = jstDate();
  quiz.value = buildQuiz(mode, QUESTIONS, grade.value, today.value);
  if (quiz.value.items.length === 0) return;
  screen.value = 'quiz';
}

function finish(result: AnswerRecord[]) {
  answers.value = result;
  dailyStreak.value = null;
  // 今日のチャレンジは、さいごまでやればクリア (何問正解でも)
  if (quiz.value?.mode === 'daily') {
    record.value = recordDailyClear(quiz.value.grade, today.value);
    dailyStreak.value = streakOf(record.value[quiz.value.grade] ?? [], today.value);
  }
  const score = result.filter((a) => a.correct).length * POINTS_PER_QUESTION;
  if (rankFor(score, result.length * POINTS_PER_QUESTION).celebrate) {
    sound.fanfare();
    if (confettiCanvas.value) stopConfetti = startConfetti(confettiCanvas.value);
  }
  screen.value = 'result';
}

/** スタンプカードを開く。今日のチャレンジの結果から来たときは、今日のスタンプを押すアニメーションをする */
function openStamps() {
  sound.init();
  stopConfetti();
  pressedStamp.value = screen.value === 'result' && dailyStreak.value !== null ? today.value : null;
  screen.value = 'stamps';
}

function backToStart() {
  sound.init();
  stopConfetti();
  today.value = jstDate();
  screen.value = 'start';
}

function toggleSound() {
  sound.enabled = !sound.enabled;
  soundOn.value = sound.enabled;
}

// 最初の画面を出してから、ログインと Firestore の準備をする (Firebase の設定がないビルドでは何もしない)
onMounted(() => {
  void startCloud({
    onStatus: () => {
      cloudStatus.value = getSync()?.status ?? 'loading';
    },
    // ログイン・ログアウトや Firestore からの取りこみで、手元の記録が変わった
    onData: () => {
      grade.value = loadGrade();
      record.value = loadDailyRecord();
    },
    askMigrate: () =>
      confirm(
        'この たんまつの きろくを アカウントに うつしますか？\n\n「OK」… うつす (アカウントの きろくと 合わせます)\n「キャンセル」… うつさない (たんまつの きろくは そのまま のこります)',
      ),
  });
});

onBeforeUnmount(() => stopConfetti());
</script>

<template>
  <div class="background-decorations" aria-hidden="true">
    <div class="floating-shape shape-1">🗾</div>
    <div class="floating-shape shape-2">⭐</div>
    <div class="floating-shape shape-3">🌸</div>
    <div class="floating-shape shape-4">富士山</div>
    <div class="floating-shape shape-5">🎒</div>
    <div class="floating-shape shape-6">✨</div>
  </div>

  <main class="app-container" :class="{ 'is-wide': screen === 'start' }">
    <header class="app-header">
      <AccountBox v-if="cloudAvailable" :status="cloudStatus" />
      <button type="button" class="icon-btn" aria-label="効果音切り替え" @click="toggleSound">
        <span>{{ soundOn ? '🔊' : '🔇' }}</span> 効果音: <span>{{ soundOn ? 'ON' : 'OFF' }}</span>
      </button>
    </header>

    <StartScreen
      v-if="screen === 'start'"
      :grade="grade"
      :record="record"
      :today="today"
      :question-count="QUESTIONS.length"
      @update:grade="setGrade"
      @start="start"
      @stamps="openStamps"
    />
    <QuizScreen v-else-if="screen === 'quiz' && quiz" :quiz="quiz" @finish="finish" />
    <ResultScreen
      v-else-if="screen === 'result'"
      :answers="answers"
      :daily-streak="dailyStreak"
      @restart="backToStart"
      @stamps="openStamps"
    />
    <StampScreen
      v-else-if="screen === 'stamps'"
      :grade="grade"
      :dates="record[grade] ?? []"
      :today="today"
      :pressed="pressedStamp"
      @back="backToStart"
    />
  </main>

  <footer class="app-footer">
    <p>© 2026 c1t0d0s0</p>
  </footer>

  <canvas id="confetti-canvas" ref="confetti"></canvas>
</template>
