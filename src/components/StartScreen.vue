<!-- スタート画面: 今日のチャレンジと、じゆうに あそぶモードの選択 -->
<script setup lang="ts">
import { ref } from 'vue';
import { battleAvailable } from '../cloud';
import { QUIZ_LENGTH, TIME_LIMIT } from '../core/quiz';
import type { DailyRecord } from '../core/storage';
import type { Grade, Mode } from '../types';
import DailyPanel from './DailyPanel.vue';
import SparrowIcon from './SparrowIcon.vue';

type FreeMode = Exclude<Mode, 'daily'>;

const props = defineProps<{ grade: Grade; record: DailyRecord; today: string; questionCount: number }>();
const emit = defineEmits<{ 'update:grade': [grade: Grade]; start: [mode: Mode]; stamps: []; cards: []; battle: [] }>();

// 問題数は 100 問単位で「○○問+」と表示する (問題を足しても書きかえなくてよいように)
const roundedCount = `${Math.floor(props.questionCount / 100) * 100}問+`;

const MODES: { mode: FreeMode; icon: string; name: string }[] = [
  { mode: 'silhouette', icon: '🗺️', name: 'シルエット' },
  { mode: 'knowledge', icon: '💡', name: `ちしき (${roundedCount})` },
  { mode: 'mix', icon: '🌟', name: 'ミックス' },
];
const selected = ref<FreeMode>('silhouette');
</script>

<template>
  <section class="card screen active start-screen">
    <div class="title-badge">日本ちずマスター</div>
    <h1 class="main-title">
      <span class="title-sub">形（かたち）と ちしきで学べる！</span>
      <span class="title-row">
        <span>都道府県クイズ！</span>
        <SparrowIcon />
      </span>
    </h1>

    <!-- PC では 左に今日のチャレンジ、右に じゆうに あそぶ をならべる (縦にスクロールしなくてよいように) -->
    <div class="start-columns">
      <div class="daily-column">
        <DailyPanel
          :grade="grade"
          :record="record"
          :today="today"
          @update:grade="emit('update:grade', $event)"
          @start="emit('start', 'daily')"
          @stamps="emit('stamps')"
        />
        <!-- 都道府県カードは、今日のチャレンジでも じゆうに あそぶ でも もらえるので、黄色い わくの外に置く -->
        <button type="button" class="stamp-link cards-link" @click="emit('cards')">🎴 都道府県カードを 見る</button>
      </div>

      <div class="free-play">
        <div class="free-play-title">🎮 じゆうに あそぶ</div>
        <div class="mascot-box">
          <div class="mascot-img">🗺️</div>
          <p class="mascot-bubble">
            日本全国47都道府県の「形」や「名物・日本一（全{{ questionCount }}問）」のクイズに挑戦しよう！
          </p>
        </div>

        <div class="mode-select-section">
          <div class="mode-select-title">あそぶモードを選んでね！</div>
          <div class="mode-select-container">
            <button
              v-for="m in MODES"
              :key="m.mode"
              type="button"
              class="mode-btn"
              :class="{ active: selected === m.mode }"
              :aria-pressed="selected === m.mode"
              @click="selected = m.mode"
            >
              <span class="mode-icon">{{ m.icon }}</span>
              <span class="mode-name">{{ m.name }}</span>
            </button>
          </div>
        </div>

        <div class="rule-box">
          <div class="rule-item">
            <span class="rule-icon">❓</span>
            <span>ぜんぶで <strong>{{ QUIZ_LENGTH }}問</strong> 出題！</span>
          </div>
          <div class="rule-item">
            <span class="rule-icon">⏱️</span>
            <span>1問の制限時間は <strong>{{ TIME_LIMIT }}秒</strong>！</span>
          </div>
          <div class="rule-item">
            <span class="rule-icon">🎯</span>
            <span>4つの選択肢から選ぼう！</span>
          </div>
          <div class="rule-item">
            <span class="rule-icon">🎴</span>
            <span>おなじ 都道府県の シルエットと ちしきに 正解すると <strong>カード</strong>が もらえる！</span>
          </div>
        </div>

        <button type="button" class="btn btn-primary pulse-btn" @click="emit('start', selected)">
          <span>クイズをはじめる！</span> 🚀
        </button>
        <!-- ともだちと オンラインで たいせん (Realtime Database の設定があるビルドだけ) -->
        <button v-if="battleAvailable" type="button" class="battle-open-btn" @click="emit('battle')">
          ⚔️ ともだちと シルエット たいせん
        </button>
      </div>
    </div>
  </section>
</template>
