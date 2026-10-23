<!-- たいせん の待ち画面: コード・QRコード・招待の URL と、入っている人。ホストが スタート を押す -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { playersList, type Room } from '../../battle/battle';

const props = defineProps<{ room: Room; code: string; uid: string; seat: string | null }>();
const emit = defineEmits<{ start: [] }>();

const isHost = computed(() => props.room.hostUid === props.uid);
const players = computed(() => playersList(props.room));
const here = computed(() => players.value.filter((p) => p.online).length);
const starting = ref(false);
const copied = ref(false);
const qr = ref('');

const inviteUrl = computed(() => {
  const url = new URL(location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('battle', props.code);
  return url.href;
});

const hint = computed(() => {
  if (!isHost.value) return 'ホストが スタートするのを まってね';
  return here.value < 2 ? 'ともだちが 入るのを まってね。コードか QRコードを 見せよう！' : 'みんな そろったら スタート！';
});

async function copy() {
  try {
    await navigator.clipboard.writeText(inviteUrl.value);
    copied.value = true;
  } catch {
    // コピーできないときは、URL を自分で選んでもらう
  }
}

function start() {
  starting.value = true;
  emit('start');
  // 通信に失敗して はじまらなかったときは、もう一度 押せるようにする
  setTimeout(() => (starting.value = false), 5000);
}

// QR コードの部品は、待ち画面を開いたときにだけ読みこむ。作れなくても、コードと URL で入れる
onMounted(async () => {
  try {
    const QRCode = (await import('qrcode')).default;
    qr.value = await QRCode.toDataURL(inviteUrl.value, { margin: 1, width: 220, color: { dark: '#1e2a23', light: '#f4f1e8' } });
  } catch {
    qr.value = '';
  }
});
</script>

<template>
  <div class="battle-lobby">
    <h2 class="battle-title">⚔️ たいせんの へや</h2>
    <p class="battle-setting">シルエット・{{ room.count }}問・せんたくし 6つ</p>

    <div class="battle-invite">
      <div class="battle-code-box">
        <span class="battle-label">たいせんコード</span>
        <span class="battle-code" data-testid="battle-code">{{ code }}</span>
      </div>
      <img v-if="qr" class="battle-qr" :src="qr" width="140" height="140" alt="へやに入る QRコード" />
    </div>
    <div class="battle-url-row">
      <input class="battle-input battle-url" type="text" readonly :value="inviteUrl" aria-label="招待の URL" @focus="($event.target as HTMLInputElement).select()" />
      <button type="button" class="icon-btn" @click="copy">{{ copied ? '✔ コピーした' : '📋 コピー' }}</button>
    </div>

    <ul class="battle-players">
      <li v-for="p in players" :key="p.seat" class="battle-player" :class="{ 'is-offline': !p.online }">
        <span>{{ p.name }}</span>
        <span v-if="p.uid === room.hostUid" class="battle-tag">ホスト</span>
        <span v-if="p.seat === seat" class="battle-tag is-me">じぶん</span>
        <span v-if="!p.online" class="battle-tag">ぬけた</span>
      </li>
    </ul>

    <p class="battle-message" role="status">{{ hint }}</p>
    <button
      v-if="isHost"
      type="button"
      class="btn btn-primary battle-main-btn"
      :disabled="here < 2 || starting"
      @click="start"
    >
      スタート！ 🚀
    </button>
  </div>
</template>
