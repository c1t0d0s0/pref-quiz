// たいせん の決まりごと (通信なし)
import { describe, expect, it } from 'vitest';
import {
  COUNTS,
  cleanName,
  dataVersion,
  makeCode,
  makeGame,
  parseCode,
  settled,
  standings,
  takeOf,
  type Room,
} from '../src/battle/battle';
import { accountUid } from '../src/cloud/sync';
import { SIMILAR } from '../src/data';

const room = (over: Partial<Room> = {}): Room => ({
  app: 'pref-quiz',
  hostUid: 'a',
  createdAt: 0,
  count: 5,
  version: dataVersion(),
  round: 1,
  seed: 'abc',
  status: 'playing',
  q: 0,
  qAt: 0,
  players: {
    0: { uid: 'a', name: 'あおい', joinedAt: 1, online: true },
    1: { uid: 'b', name: 'ひかる', joinedAt: 2, online: true },
    2: { uid: 'c', name: 'そら', joinedAt: 3, online: true },
  },
  takes: {},
  faults: {},
  ...over,
});

describe('コードと名前', () => {
  it('コードは 0 から始まらない数字5けた。全角・空白・ハイフンも読める', () => {
    expect(makeCode(() => 0)).toBe('10000');
    expect(makeCode(() => 0.99999)).toBe('99999');
    expect(parseCode('１２３４５')).toBe('12345');
    expect(parseCode(' 123-45 ')).toBe('12345');
    expect(parseCode('01234')).toBeNull();
    expect(parseCode('1234')).toBeNull();
    expect(parseCode('abcde')).toBeNull();
  });

  it('名前は制御文字を消し、空白をまとめて、10文字まで', () => {
    expect(cleanName('  たろう\u0000  くん ')).toBe('たろう くん');
    expect(cleanName('あいうえおかきくけこさしすせそ')).toBe('あいうえおかきくけこ');
    expect(cleanName('   ')).toBe('');
  });
});

describe('makeGame', () => {
  it('同じ seed・回なら、どの端末でも同じ問題と選択肢。回が変わると変わる', () => {
    const a = makeGame('seed1', 1, 10);
    const b = makeGame('seed1', 1, 10);
    expect(b.items.map((i) => i.answer.id)).toEqual(a.items.map((i) => i.answer.id));
    expect(b.options.map((o) => o.map((p) => p.id))).toEqual(a.options.map((o) => o.map((p) => p.id)));
    const c = makeGame('seed1', 2, 10);
    expect(c.items.map((i) => i.answer.id)).not.toEqual(a.items.map((i) => i.answer.id));
  });

  it.each(COUNTS)('%i問: どの問題も、正解をふくむ ちがう6つの選択肢で、答えは重ならない', (count) => {
    for (let s = 0; s < 30; s++) {
      const game = makeGame(`s${s}`, 1, count);
      expect(game.items).toHaveLength(count);
      expect(new Set(game.items.map((i) => i.answer.id)).size).toBe(count);
      game.items.forEach((item, i) => {
        const ids = game.options[i].map((p) => p.id);
        expect(ids).toHaveLength(6);
        expect(new Set(ids).size).toBe(6);
        expect(ids).toContain(item.answer.id);
        // 形の似ている都道府県を (あれば) 2つは入れる (ほかの まちがいに たまたま入ることもある)
        const similar = SIMILAR[item.answer.id] ?? [];
        expect(game.options[i].filter((p) => similar.includes(p.name)).length).toBeGreaterThanOrEqual(Math.min(2, similar.length));
      });
    }
  });

  it('作り方の指紋は、いつも同じ', () => {
    expect(dataVersion()).toMatch(/^p1-[0-9a-z]+$/);
    expect(dataVersion()).toBe(dataVersion());
  });
});

describe('札と順位', () => {
  it('前の回の札は数えない', () => {
    const r = room({ round: 2, takes: { 0: { seat: '1', round: 1, at: 0 } } });
    expect(takeOf(r, 0)).toBeNull();
    expect(settled(r, 0)).toBe(false);
  });

  it('だれかがとるか、オンラインの全員がおてつきしたら、その問題は終わり', () => {
    expect(settled(room({ takes: { 0: { seat: '2', round: 1, at: 0 } } }), 0)).toBe(true);
    expect(settled(room({ faults: { 0: { 0: true, 1: true } } }), 0)).toBe(false);
    expect(settled(room({ faults: { 0: { 0: true, 1: true, 2: true } } }), 0)).toBe(true);
    // ぬけた人は待たない
    const left = room({ faults: { 0: { 0: true, 1: true } } });
    left.players[2].online = false;
    expect(settled(left, 0)).toBe(true);
  });

  it('札の多い順、同じなら おてつきの少ない順。同じなら同じ順位、ぬけた人は最後で順位なし', () => {
    const r = room({
      takes: {
        0: { seat: '1', round: 1, at: 0 },
        1: { seat: '0', round: 1, at: 0 },
        2: { seat: '1', round: 1, at: 0 },
        3: { seat: '2', round: 1, at: 0 },
        4: { seat: '0', round: 1, at: 0 },
      },
      faults: { 1: { 1: true } },
    });
    r.players[3] = { uid: 'd', name: 'ぬけた人', joinedAt: 4, online: false };
    r.takes[3] = { seat: '3', round: 1, at: 0 };
    const rows = standings(r);
    expect(rows.map((x) => [x.name, x.cards, x.faults, x.rank])).toEqual([
      ['あおい', 2, 0, 1],
      ['ひかる', 2, 1, 2],
      ['そら', 0, 0, 3],
      ['ぬけた人', 1, 0, null],
    ]);
    // 札もおてつきも同じなら同じ順位
    const tie = standings(room({ takes: { 0: { seat: '0', round: 1, at: 0 }, 1: { seat: '1', round: 1, at: 0 } } }));
    expect(tie.map((x) => x.rank)).toEqual([1, 1, 3]);
  });
});

describe('匿名ログイン', () => {
  it('たいせん のための匿名ログインは、ログインしていないものとして扱う', () => {
    expect(accountUid({ uid: 'x', isAnonymous: true })).toBeNull();
    expect(accountUid({ uid: 'x', isAnonymous: false })).toBe('x');
    expect(accountUid(null)).toBeNull();
  });
});
