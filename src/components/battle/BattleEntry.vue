<!-- たいせん の入口: なまえ、へやを つくる (出題数をえらぶ)、コードを入れて はいる -->
<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue';
import { COUNTS, NAME_MAX, cleanName, parseCode } from '../../battle/battle';

const props = defineProps<{ initialName: string; initialCode: string | null; busy: boolean; message: string }>();
const emit = defineEmits<{
  create: [name: string, count: number];
  join: [name: string, code: string];
  invalid: [message: string];
  home: [];
}>();

const name = ref(props.initialName);
const count = ref<number>(10);
const codeInput = ref(props.initialCode ?? '');
const nameEl = useTemplateRef<HTMLInputElement>('nameEl');
const codeEl = useTemplateRef<HTMLInputElement>('codeEl');

function takeName(): string | null {
  const cleaned = cleanName(name.value);
  name.value = cleaned;
  if (cleaned) return cleaned;
  emit('invalid', 'なまえを 入れてね');
  nameEl.value?.focus();
  return null;
}

function create() {
  const n = takeName();
  if (n) emit('create', n, count.value);
}

function join() {
  const n = takeName();
  if (!n) return;
  const code = parseCode(codeInput.value);
  if (!code) {
    emit('invalid', 'コードは 数字5けた だよ');
    codeEl.value?.focus();
    return;
  }
  emit('join', n, code);
}

// 招待の URL から来たとき: なまえがわかっていれば、そのまま入る。なければ、なまえを聞く
onMounted(() => {
  if (!props.initialCode) return;
  if (cleanName(name.value)) join();
  else nameEl.value?.focus();
});
</script>

<template>
  <div class="battle-entry">
    <h2 class="battle-title">⚔️ シルエット たいせん</h2>
    <p class="battle-lead">ともだちと 同じ シルエットを 見て、早く 正しい 都道府県を えらんだ人が 札を とるよ！</p>

    <label class="battle-field">
      <span class="battle-label">なまえ</span>
      <input
        ref="nameEl"
        v-model="name"
        class="battle-input"
        type="text"
        :maxlength="NAME_MAX * 2"
        autocomplete="nickname"
        placeholder="ニックネーム"
      />
    </label>

    <div class="battle-box">
      <div class="battle-box-title">🏠 へやを つくる</div>
      <div class="battle-pills" role="group" aria-label="出題数">
        <button
          v-for="c in COUNTS"
          :key="c"
          type="button"
          class="grade-btn"
          :class="{ active: count === c }"
          :aria-pressed="count === c"
          @click="count = c"
        >
          {{ c }}問
        </button>
      </div>
      <button type="button" class="btn btn-primary battle-main-btn" :disabled="busy" @click="create">へやを つくる</button>
    </div>

    <div class="battle-box">
      <div class="battle-box-title">🚪 へやに はいる</div>
      <div class="battle-join-row">
        <input
          ref="codeEl"
          v-model="codeInput"
          class="battle-input battle-code-input"
          type="text"
          inputmode="numeric"
          maxlength="8"
          placeholder="5けたの コード"
          aria-label="たいせんコード"
          @keydown.enter="join"
        />
        <button type="button" class="btn btn-primary battle-join-btn" :disabled="busy" @click="join">はいる</button>
      </div>
    </div>

    <p class="battle-message" role="status">{{ message }}</p>
    <button type="button" class="battle-text-btn" @click="emit('home')">🏠 タイトルへ もどる</button>
  </div>
</template>
