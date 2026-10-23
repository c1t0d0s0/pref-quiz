// たいせん の通信 (Firebase Realtime Database)。たいせん で Firebase を使うのは、このファイルだけ。
// たいせん の画面を開いたときにだけ読みこむ (kanji-quiz・math-quiz の battle-net.js と同じしくみ)。
import { signInAnonymously } from 'firebase/auth';
import {
  connectDatabaseEmulator,
  get,
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  runTransaction,
  serverTimestamp,
  set,
  update,
  type Database,
  type OnDisconnect,
} from 'firebase/database';
import {
  COUNTDOWN_MS,
  REVEAL_MS,
  ROOM_TTL_MS,
  dataVersion,
  freeSeat,
  makeCode,
  makeSeed,
  seatOf,
  type Player,
  type Room,
  type Take,
} from '../battle/battle';
import { firebaseApp, firebaseAuth } from './app';
import { useEmulator } from './config';

/** Realtime Database の中で、このアプリの部屋を置く場所 (kanji-quiz の kanjiBattles などとは分ける) */
export const ROOT = 'prefBattles';

export type JoinResult = 'ok' | 'missing' | 'started' | 'full' | 'version';

/** たいせん の画面から使う窓口 */
export interface BattleNet {
  uid: string;
  /** サーバーの時計での今 */
  serverNow(): number;
  seatIn(code: string): string | null;
  create(count: number, name: string): Promise<string>;
  join(code: string, name: string): Promise<JoinResult>;
  watch(code: string, cb: (room: Room | null) => void): () => void;
  take(code: string, round: number, q: number): Promise<boolean>;
  fault(code: string, q: number): Promise<void>;
  start(code: string): Promise<void>;
  advance(code: string, q: number): Promise<void>;
  end(code: string): Promise<void>;
  rematch(code: string, round: number): Promise<void>;
  leave(code: string): Promise<void>;
}

let db: Database | null = null;

function database(): Database {
  if (db) return db;
  db = getDatabase(firebaseApp());
  if (useEmulator) connectDatabaseEmulator(db, '127.0.0.1', 9000);
  return db;
}

/** 席の番号 (0〜7) や問題の番号は数字なので、配列で返ってくることがある。いつも { 番号: 中身 } の形にそろえる */
function normalize(val: unknown): Room | null {
  if (!val || typeof val !== 'object') return null;
  const raw = val as Partial<Room> & Record<string, unknown>;
  const players: Record<string, Player> = {};
  for (const [seat, p] of Object.entries(raw.players ?? {})) if (p) players[seat] = p;
  const takes: Record<string, Take> = {};
  for (const [q, take] of Object.entries(raw.takes ?? {})) if (take) takes[q] = take;
  const faults: Record<string, Record<string, boolean>> = {};
  for (const [q, seats] of Object.entries(raw.faults ?? {})) {
    if (seats) faults[q] = Object.fromEntries(Object.entries(seats).filter(([, v]) => v));
  }
  return { ...(raw as Room), players, takes, faults };
}

let connecting: Promise<BattleNet> | null = null;

/** ログインしていなければ匿名でログインして、たいせん の通信を始める */
export function connectBattle(): Promise<BattleNet> {
  if (!connecting) {
    connecting = open();
    connecting.catch(() => {
      connecting = null;
    });
  }
  return connecting;
}

async function open(): Promise<BattleNet> {
  const auth = firebaseAuth();
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
  const uid = auth.currentUser!.uid;
  const d = database();
  const roomRef = (code: string) => ref(d, `${ROOT}/${code}`);
  const seatRef = (code: string, seat: string) => ref(d, `${ROOT}/${code}/players/${seat}`);

  let offset = 0;
  onValue(ref(d, '.info/serverTimeOffset'), (snap) => {
    offset = Number(snap.val()) || 0;
  });
  const serverNow = () => Date.now() + offset;

  // 部屋ごとの自分の席。つながり直したら online にもどし、切れたときの予約をかけ直す
  const mySeat = new Map<string, string>();
  const disconnects = new Map<string, OnDisconnect>();
  onValue(ref(d, '.info/connected'), (snap) => {
    if (snap.val() !== true) return;
    mySeat.forEach((seat, code) => void markOnline(code, seat));
  });

  async function markOnline(code: string, seat: string) {
    const r = ref(d, `${ROOT}/${code}/players/${seat}/online`);
    const od = onDisconnect(r);
    disconnects.set(code, od);
    await od.set(false);
    await set(r, true).catch(() => {});
  }

  const freshPlayer = (name: string): Player => ({ uid, name, joinedAt: serverNow(), online: true });

  return {
    uid,
    serverNow,
    seatIn: (code) => mySeat.get(code) ?? null,

    // 部屋を作って、自分も席にすわる。もどり値は対戦コード
    async create(count, name) {
      for (let tries = 0; tries < 20; tries++) {
        const code = makeCode();
        const room = {
          app: 'pref-quiz',
          hostUid: uid,
          createdAt: serverTimestamp(),
          count,
          version: dataVersion(),
          round: 1,
          seed: '',
          status: 'waiting',
          players: { 0: freshPlayer(name) },
        };
        // 使われていない番号 (または1日以上前の古い部屋) のときだけ作る
        const now = serverNow();
        const result = await runTransaction(
          roomRef(code),
          (current) => (current && current.createdAt >= now - ROOM_TTL_MS ? undefined : room),
          { applyLocally: false },
        );
        if (!result.committed) continue;
        mySeat.set(code, '0');
        await markOnline(code, '0');
        return code;
      }
      throw new Error('対戦コードを作れませんでした');
    },

    // 部屋に入る (すでにすわっていれば、その席にもどる)
    async join(code, name) {
      for (let tries = 0; tries < 10; tries++) {
        const room = normalize((await get(roomRef(code))).val());
        if (!room) return 'missing';
        if (room.version !== dataVersion()) return 'version';
        const mine = seatOf(room, uid);
        if (mine) {
          mySeat.set(code, mine);
          await update(seatRef(code, mine), { name });
          await markOnline(code, mine);
          return 'ok';
        }
        if (room.status !== 'waiting') return 'started';
        const seat = freeSeat(room);
        if (!seat) return 'full';
        try {
          await set(seatRef(code, seat), freshPlayer(name));
          mySeat.set(code, seat);
          await markOnline(code, seat);
          return 'ok';
        } catch {
          // ほぼ同時に、ほかの人が同じ席にすわった。もういちど空いている席をさがす
        }
      }
      return 'full';
    },

    // 部屋のようすを見つづける。部屋がなくなると null が来る。もどり値は見るのをやめる関数
    watch(code, cb) {
      return onValue(
        roomRef(code),
        (snap) => cb(normalize(snap.val())),
        () => cb(null),
      );
    },

    // q 問目の札をとる (ほかの人が先にとっていなければ)。自分がとれたら true
    async take(code, round, q) {
      const seat = mySeat.get(code);
      if (!seat) return false;
      const result = await runTransaction(
        ref(d, `${ROOT}/${code}/takes/${q}`),
        (current) => (current ? undefined : { seat, round, at: serverTimestamp() }),
        { applyLocally: false },
      ).catch(() => null);
      const take = result?.snapshot.val() as Take | null | undefined;
      return Boolean(result?.committed && take && take.seat === seat);
    },

    // q 問目で おてつき
    async fault(code, q) {
      const seat = mySeat.get(code);
      if (seat) await set(ref(d, `${ROOT}/${code}/faults/${q}/${seat}`), true).catch(() => {});
    },

    // ホストだけ: 新しい問題の種を決めて、カウントダウンを始める
    async start(code) {
      const startAt = serverNow() + COUNTDOWN_MS;
      await update(roomRef(code), {
        seed: makeSeed(),
        status: 'playing',
        startAt,
        q: 0,
        qAt: startAt,
        takes: null,
        faults: null,
      });
    },

    // ホストだけ: 答えを見せたあと、次の問題にする
    async advance(code, q) {
      await update(roomRef(code), { q, qAt: serverNow() + REVEAL_MS });
    },

    // ホストだけ: この回を終わりにする
    async end(code) {
      await set(ref(d, `${ROOT}/${code}/status`), 'finished');
    },

    // ホストだけ: 同じ部屋で、次の回の待ち画面にもどる
    async rematch(code, round) {
      await update(roomRef(code), { round: round + 1, status: 'waiting', seed: '', takes: null, faults: null });
    },

    // 部屋を出る。ホストなら部屋ごと消す
    async leave(code) {
      const seat = mySeat.get(code);
      mySeat.delete(code);
      await disconnects
        .get(code)
        ?.cancel()
        .catch(() => {});
      disconnects.delete(code);
      const room = normalize((await get(roomRef(code)).catch(() => null))?.val());
      if (!room) return;
      if (room.hostUid === uid) {
        await remove(roomRef(code)).catch(() => {});
      } else if (seat && room.players[seat]?.uid === uid) {
        // 待っている間なら席をあける。対戦のとちゅうなら、とった札は順位表に残す
        if (room.status === 'waiting') await remove(seatRef(code, seat)).catch(() => {});
        else await update(seatRef(code, seat), { online: false }).catch(() => {});
      }
    },
  };
}
