<!-- 画面の切りかえ (スタート → クイズ → 結果、スタンプカード、都道府県カード) と、学年・今日のチャレンジ・カードの記録 -->
<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import AccountBox from './components/AccountBox.vue';
import StartScreen from './components/StartScreen.vue';
import QuizScreen from './components/QuizScreen.vue';
import ResultScreen from './components/ResultScreen.vue';
import StampScreen from './components/StampScreen.vue';
import CardScreen from './components/cards/CardScreen.vue';
import { parseCode } from './battle/battle';
import { battleAvailable, cloudAvailable, getSync, startCloud } from './cloud';
import type { SyncStatus } from './cloud/sync';
import { addAnswers, newCards as findNewCards, type CardEntry } from './core/cards';
import { startConfetti } from './core/confetti';
import { streakOf } from './core/daily';
import { jstDate } from './core/date';
import { buildQuiz, POINTS_PER_QUESTION, rankFor } from './core/quiz';
import { sound } from './core/sound';
import { loadCardRecord, loadDailyRecord, loadGrade, recordDailyClear, saveCardRecord, saveGrade } from './core/storage';
import { QUESTIONS } from './data';
import type { AnswerRecord, Grade, Mode, Quiz } from './types';

// たいせん の画面は、開いたときにだけ読みこむ
const BattleScreen = defineAsyncComponent(() => import('./components/battle/BattleScreen.vue'));

type Screen = 'start' | 'quiz' | 'result' | 'stamps' | 'cards' | 'battle';

/** 招待の URL (?battle=12345) から来たときの、たいせんコード */
const invitedCode = ref(battleAvailable ? parseCode(new URLSearchParams(location.search).get('battle') ?? '') : null);

const screen = ref<Screen>(invitedCode.value ? 'battle' : 'start');
const grade = ref<Grade>(loadGrade());
const record = ref(loadDailyRecord());
const today = ref(jstDate());
const quiz = ref<Quiz | null>(null);
const answers = ref<AnswerRecord[]>([]);
const dailyStreak = ref<number | null>(null);
const cardRecord = ref(loadCardRecord());
/** いま終わったクイズで もらったカード */
const newCards = ref<CardEntry[]>([]);
/** カードの画面で「もらったばかり」として見せるカード (結果画面からカードの画面を開いたときだけ) */
const freshCards = ref<CardEntry[]>([]);
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
  // シルエットと ちしきの両方に正解した都道府県のカードをわたす
  if (quiz.value) {
    const before = loadCardRecord();
    const after = addAnswers(before, result, quiz.value.grade);
    newCards.value = findNewCards(before, after);
    saveCardRecord(after);
    cardRecord.value = after;
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

/** 都道府県カードの画面を開く。結果画面から来たときは、もらったばかりのカードを見せる */
function openCards() {
  sound.init();
  stopConfetti();
  freshCards.value = screen.value === 'result' ? newCards.value : [];
  screen.value = 'cards';
}

function openBattle() {
  sound.init();
  invitedCode.value = null;
  screen.value = 'battle';
}

function backToStart() {
  sound.init();
  stopConfetti();
  invitedCode.value = null;
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
      cardRecord.value = loadCardRecord();
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
      @cards="openCards"
      @battle="openBattle"
    />
    <QuizScreen v-else-if="screen === 'quiz' && quiz" :quiz="quiz" @finish="finish" />
    <ResultScreen
      v-else-if="screen === 'result'"
      :answers="answers"
      :daily-streak="dailyStreak"
      :new-cards="newCards"
      @restart="backToStart"
      @stamps="openStamps"
      @cards="openCards"
    />
    <StampScreen
      v-else-if="screen === 'stamps'"
      :grade="grade"
      :dates="record[grade] ?? []"
      :today="today"
      :pressed="pressedStamp"
      @back="backToStart"
    />
    <CardScreen
      v-else-if="screen === 'cards'"
      :grade="grade"
      :record="cardRecord"
      :fresh="freshCards"
      @back="backToStart"
    />
    <BattleScreen v-else-if="screen === 'battle'" :invited="invitedCode" @home="backToStart" />
  </main>

  <footer class="app-footer">
    <p>© 2026 c1t0d0s0</p>
  </footer>

  <canvas id="confetti-canvas" ref="confetti"></canvas>
</template>
