<!--
  たいせん: 入口 → 待ち画面 (コード・QRコード・URL) → カウントダウン → たいせん → 結果。
  画面はいつも Realtime Database の部屋のようすに合わせる。進めるのはホストの端末だけ
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import type { Room } from '../../battle/battle';
import type { BattleNet, JoinResult } from '../../cloud/battle-net';
import { sound } from '../../core/sound';
import BattleEntry from './BattleEntry.vue';
import BattleLobby from './BattleLobby.vue';
import BattlePlay from './BattlePlay.vue';
import BattleResult from './BattleResult.vue';

const props = defineProps<{ invited: string | null }>();
const emit = defineEmits<{ home: [] }>();

const NAME_KEY = 'pref-quiz:battle-name';
const CONNECT_TIMEOUT_MS = 20000;

function savedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // 保存できなくても遊べる (次に聞きなおす)
  }
}

const net = shallowRef<BattleNet | null>(null);
const code = ref<string | null>(null);
const room = ref<Room | null>(null);
const message = ref('');
const busy = ref(false);
/** 招待の URL のコード。自動で入るのは最初の1回だけ (部屋がなくなって入口にもどったときに、また入ろうとしないように) */
const pendingInvite = ref(props.invited);
let unwatch: (() => void) | null = null;

const view = computed(() => {
  if (!code.value || !room.value) return 'entry';
  if (room.value.status === 'waiting') return 'lobby';
  return room.value.status === 'playing' ? 'play' : 'result';
});

/** URL に部屋のコードを入れておく (読みこみ直しても、同じ部屋にもどれるように) */
function setUrl(roomCode: string | null) {
  const url = new URL(location.href);
  if (roomCode) url.searchParams.set('battle', roomCode);
  else url.searchParams.delete('battle');
  history.replaceState(null, '', url);
}

async function connect(): Promise<BattleNet> {
  if (net.value) return net.value;
  message.value = 'つないでいます…';
  const { connectBattle } = await import('../../cloud/battle-net');
  net.value = await connectBattle();
  return net.value;
}

async function run(job: (n: BattleNet) => Promise<void>) {
  if (busy.value) return;
  busy.value = true;
  sound.init();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    // つながらないまま待ちつづけないよう、時間を区切る
    const limit = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error('timeout')), CONNECT_TIMEOUT_MS);
    });
    await Promise.race([connect().then(job), limit]);
  } catch (err) {
    console.error('Battle failed', err);
    message.value = 'つながりませんでした。時間を おいて、もう一度 ためしてね。';
  } finally {
    clearTimeout(timeout);
    busy.value = false;
  }
}

const JOIN_ERRORS: Record<Exclude<JoinResult, 'ok'>, string> = {
  missing: 'その コードの へやは 見つからないよ。',
  started: 'その へやは もう はじまっているよ。',
  full: 'その へやは いっぱいだよ（8人まで）。',
  version: 'ページを 読みこみ直してから 入ってね（新しい 問題に なっているよ）。',
};

function create(name: string, count: number) {
  pendingInvite.value = null;
  saveName(name);
  void run(async (n) => enter(n, await n.create(count, name)));
}

function join(name: string, roomCode: string) {
  pendingInvite.value = null;
  saveName(name);
  void run(async (n) => {
    const result = await n.join(roomCode, name);
    if (result === 'ok') enter(n, roomCode);
    else message.value = JOIN_ERRORS[result];
  });
}

function enter(n: BattleNet, roomCode: string) {
  code.value = roomCode;
  room.value = null;
  message.value = '';
  setUrl(roomCode);
  unwatch = n.watch(roomCode, (next) => {
    if (code.value !== roomCode) return;
    if (!next) {
      stop();
      message.value = 'へやが なくなりました（ホストが ぬけたよ）';
      return;
    }
    room.value = next;
  });
}

function stop() {
  unwatch?.();
  unwatch = null;
  code.value = null;
  room.value = null;
  setUrl(null);
}

/** 部屋を出る (ホストが出ると、部屋ごとなくなる) */
async function leave() {
  const left = code.value;
  stop();
  if (left && net.value) await net.value.leave(left).catch(() => {});
}

/** ホストだけ: スタート */
function startRound() {
  if (net.value && code.value) net.value.start(code.value).catch((err) => console.error(err));
}

/** ホストだけ: 同じへやで もう一度 */
function rematch() {
  if (net.value && code.value && room.value) net.value.rematch(code.value, room.value.round).catch((err) => console.error(err));
}

async function leaveRoom() {
  if (view.value === 'play' && !confirm('たいせんを ぬけますか？')) return;
  await leave();
  message.value = '';
}

async function goHome() {
  if (view.value === 'play' && !confirm('たいせんを ぬけますか？')) return;
  await leave();
  emit('home');
}

onBeforeUnmount(() => {
  // 画面を切りかえたときも、部屋は出ておく
  if (code.value && net.value) void net.value.leave(code.value).catch(() => {});
  unwatch?.();
});
</script>

<template>
  <section class="card screen active battle-screen">
    <BattleEntry
      v-if="view === 'entry'"
      :initial-name="savedName()"
      :initial-code="pendingInvite"
      :busy="busy"
      :message="message"
      @create="create"
      @join="join"
      @home="goHome"
      @invalid="message = $event"
    />
    <template v-else-if="room && net && code">
      <BattleLobby
        v-if="view === 'lobby'"
        :room="room"
        :code="code"
        :uid="net.uid"
        :seat="net.seatIn(code)"
        @start="startRound"
      />
      <BattlePlay v-else-if="view === 'play'" :room="room" :code="code" :net="net" />
      <BattleResult
        v-else
        :room="room"
        :uid="net.uid"
        :seat="net.seatIn(code)"
        @rematch="rematch"
      />
      <div class="battle-footer">
        <button type="button" class="battle-text-btn" @click="leaveRoom">🚪 へやを 出る</button>
        <button type="button" class="battle-text-btn" @click="goHome">🏠 タイトルへ</button>
      </div>
    </template>
  </section>
</template>

