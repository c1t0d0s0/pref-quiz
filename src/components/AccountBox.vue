<!--
  きろくの ほぞん: Google でログインすると、記録を Firestore に保存して、ほかのブラウザや端末でも同じ記録で遊べる。
  ログインしない人の記録は、このブラウザ (localStorage) だけに残る。Firebase の設定がないビルドでは出さない
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { getSync } from '../cloud';
import type { SyncStatus } from '../cloud/sync';

const props = defineProps<{ status: SyncStatus }>();

const busy = ref(false);
const error = ref('');

const STATUS_TEXT: Partial<Record<SyncStatus, string>> = {
  syncing: 'ほぞん中…',
  synced: '✔ ほぞんずみ',
  offline: 'まだ ほぞんできていません',
};
const signedIn = computed(() => props.status === 'syncing' || props.status === 'synced' || props.status === 'offline');

async function signIn() {
  const sync = getSync();
  if (!sync) return;
  busy.value = true;
  error.value = '';
  try {
    await sync.signIn();
  } catch (err) {
    // 自分でログインの画面をとじたときは、何も言わない
    const code = (err as { code?: string })?.code ?? '';
    // 原因を調べられるよう、Firebase のエラーの名前も小さくそえる (README の「ログインできないとき」を参照)
    if (!/popup-closed-by-user|cancelled-popup-request/.test(code)) {
      error.value = code ? `ログインできませんでした (${code})` : 'ログインできませんでした。もういちど ためしてください。';
    }
  } finally {
    busy.value = false;
  }
}

async function signOut() {
  const sync = getSync();
  if (!sync) return;
  busy.value = true;
  try {
    if ((await sync.signOut()) === 'unsynced') {
      const ok = confirm('まだ ほぞんできていない きろくが あります。今 ログアウトすると、その分は なくなります。ログアウトしますか？');
      if (ok) await sync.signOut(true);
    }
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="account">
    <span v-if="status === 'loading'" class="account-status">たしかめています…</span>
    <template v-else-if="signedIn">
      <span class="account-status" :class="`is-${status}`" role="status" :title="status === 'offline' ? 'つながったら ほぞんします' : ''">
        ログイン中・{{ STATUS_TEXT[status] }}
      </span>
      <button type="button" class="icon-btn" :disabled="busy" @click="signOut">ログアウト</button>
    </template>
    <button
      v-else
      type="button"
      class="icon-btn account-signin"
      :disabled="busy"
      title="Googleで ログインすると、ほかの ブラウザや たんまつでも 同じ きろくで 遊べます。ログインしなくても 遊べます。"
      @click="signIn"
    >
      🔑 Googleで ログイン
    </button>
    <p v-if="error" class="account-error" role="alert">{{ error }}</p>
  </div>
</template>
