// シルエットクイズ たいせん の決まりごと (kanji-quiz の 意味かるた たいせん と同じ考え方)。
// 2〜8人で同じシルエットを同時に見て、正しい都道府県を一番早く選んだ人が札をとる。
// まちがえたら「おてつき」で、その問題はもう答えられない。
// 通信や画面には依存しない関数だけを置く (テストできるように)。
//
// prefBattles/{code}                      code = 数字5けた (0 から始まらない)
//   app: 'pref-quiz', hostUid, createdAt, count: 5 | 10 | 20, version
//   round: 1, 2, …                          「もう一度」で 1 ずつ増える
//   seed, status: 'waiting' | 'playing' | 'finished', startAt
//   q: 出している問題 (0 から), qAt: その問題を出す時刻 (サーバーの時計)
//   players/{seat}: { uid, name, joinedAt, online }      seat = 0〜7
//   takes/{q}: { seat, round, at }                        一番早く正解した人
//   faults/{q}/{seat}: true                               おてつき
import { PREFECTURES, SIMILAR } from '../data';
import { BATTLE_OPTION_COUNT, makeOptions } from '../core/quiz';
import { hashString, rngFromString, shuffle } from '../core/rng';
import type { Prefecture, QuizItem } from '../types';

/** 1つの部屋に入れる人数 */
export const MAX_PLAYERS = 8;
/** 名前の長さ (文字数) */
export const NAME_MAX = 10;
/** 出題数 */
export const COUNTS = [5, 10, 20] as const;
/** スタートを押してから、1問目が出るまで */
export const COUNTDOWN_MS = 3500;
/** 答えを見せておく時間。そのあと次の問題になる */
export const REVEAL_MS = 2000;
/** 1問の制限時間 */
export const TIME_LIMIT_MS = 15000;
/** 作ってからこれだけたった部屋は、だれが消してもよい (database.rules.json と同じ値) */
export const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
/** まちがいの選択肢に入れる「形が似ている都道府県」の数 (ひとりで遊ぶシルエットモードと同じ) */
const SIMILAR_COUNT = 2;

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface Player {
  uid: string;
  name: string;
  joinedAt: number;
  online: boolean;
}

export interface Take {
  seat: string;
  round: number;
  at: number;
}

export interface Room {
  app: 'pref-quiz';
  hostUid: string;
  createdAt: number;
  count: number;
  version: string;
  round: number;
  seed: string;
  status: RoomStatus;
  startAt?: number;
  q?: number;
  qAt?: number;
  players: Record<string, Player>;
  takes: Record<string, Take>;
  faults: Record<string, Record<string, boolean>>;
}

/** 1回の対戦の問題: 出す順のシルエットと、それぞれの6つの選択肢 */
export interface Game {
  items: QuizItem[];
  options: Prefecture[][];
}

export function freeSeat(room: Room): string | null {
  for (let i = 0; i < MAX_PLAYERS; i++) if (!room.players[i]) return String(i);
  return null;
}

export function seatOf(room: Room, uid: string): string | null {
  const found = Object.entries(room.players).find(([, p]) => p.uid === uid);
  return found ? found[0] : null;
}

/** 対戦コード: 数字5けた (0 から始まる番号は使わない) */
export function makeCode(random: () => number = Math.random): string {
  return String(10000 + Math.floor(random() * 90000));
}

/** 打ちこまれたコードを整える (全角数字・空白・ハイフンを許す)。コードの形でなければ null */
export function parseCode(input: string): string | null {
  const s = String(input)
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
    .replace(/[\s\-ー－]/g, '');
  return /^[1-9]\d{4}$/.test(s) ? s : null;
}

/** 対戦ごとの乱数の種 */
export function makeSeed(random: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 10; i++) s += Math.floor(random() * 36).toString(36);
  return s;
}

/** 名前を整える。制御文字を消し、続く空白は1つにして、NAME_MAX 文字までにする */
export function cleanName(input: string): string {
  const s = String(input)
    .replace(/[\p{Cc}\p{Cf}\u2028\u2029]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  return [...s].slice(0, NAME_MAX).join('');
}

/**
 * 問題と選択肢を作る。同じ seed・round・count なら、どの端末でも同じになる。
 * 1回の対戦で、同じ都道府県が2回答えになることはない
 */
export function makeGame(seed: string, round: number, count: number): Game {
  const rng = rngFromString(`pref-battle:${seed}:${round}`);
  const items: QuizItem[] = shuffle(PREFECTURES, rng)
    .slice(0, count)
    .map((answer) => ({ type: 'silhouette', answer }));
  const options = items.map((item) => makeOptions(item, SIMILAR_COUNT, rng, BATTLE_OPTION_COUNT));
  return { items, options };
}

let version: string | null = null;

/**
 * 問題の作り方の指紋。都道府県のデータや作り方が変わると、同じ seed でも問題がずれるので、
 * 部屋に入れておいて、ちがう版のページの人には読みこみ直してもらう
 */
export function dataVersion(): string {
  if (!version) {
    const sample = makeGame('print', 1, 20);
    const text = [
      PREFECTURES.map((p) => `${p.id}:${p.name}`).join(','),
      JSON.stringify(SIMILAR),
      sample.options.map((list) => list.map((p) => p.id).join(',')).join('|'),
    ].join('\n');
    version = `p1-${hashString(text).toString(36)}`;
  }
  return version;
}

export interface PlayerRow extends Player {
  seat: string;
}

/** 入った順の参加者 */
export function playersList(room: Room): PlayerRow[] {
  return Object.entries(room.players)
    .map(([seat, p]) => ({ seat, ...p }))
    .sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0));
}

/** この回の q 問目を取った記録。まだだれも取っていなければ null (前の回の記録は数えない) */
export function takeOf(room: Room, q: number): Take | null {
  const take = room.takes[q];
  return take && take.round === room.round ? take : null;
}

export const faulted = (room: Room, q: number, seat: string | null): boolean =>
  seat !== null && room.faults[q]?.[seat] === true;

/** q 問目が終わったか: だれかが取ったか、まだいる人が全員おてつきした */
export function settled(room: Room, q: number): boolean {
  if (takeOf(room, q)) return true;
  const here = playersList(room).filter((p) => p.online);
  return here.length > 0 && here.every((p) => faulted(room, q, p.seat));
}

export interface StandingRow {
  seat: string;
  uid: string;
  name: string;
  online: boolean;
  cards: number;
  faults: number;
  /** 順位 (ぬけた人は null)。札もおてつきも同じなら同じ順位 */
  rank: number | null;
}

/** 順位表: 札の多い順、同じならおてつきの少ない順。ぬけた人は最後に、順位なしで並べる */
export function standings(room: Room): StandingRow[] {
  const rows: StandingRow[] = playersList(room).map((p) => ({
    seat: p.seat,
    uid: p.uid,
    name: p.name,
    online: p.online,
    cards: 0,
    faults: 0,
    rank: null,
  }));
  const bySeat = new Map(rows.map((row) => [row.seat, row]));
  for (let q = 0; q < room.count; q++) {
    const take = takeOf(room, q);
    const row = take && bySeat.get(take.seat);
    if (row) row.cards++;
    for (const seat of Object.keys(room.faults[q] ?? {})) {
      const r = bySeat.get(seat);
      if (r && faulted(room, q, seat)) r.faults++;
    }
  }
  rows.sort((a, b) => Number(b.online) - Number(a.online) || b.cards - a.cards || a.faults - b.faults);
  let prev: StandingRow | null = null;
  rows.forEach((row, i) => {
    if (!row.online) return;
    row.rank = prev && prev.cards === row.cards && prev.faults === row.faults ? prev.rank : i + 1;
    prev = row;
  });
  return rows;
}
