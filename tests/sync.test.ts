// ログインと Firestore との同期 (Firestore とログインは、メモリ上の代用品に差しかえる)
import { beforeEach, describe, expect, it } from 'vitest';
import { Sync, type AuthPort, type Remote, type SyncHooks } from '../src/cloud/sync';
import { mergeSnapshots, sameSnapshot } from '../src/core/merge';
import { emptySnapshot, fromAppDoc, toAppDoc, type Snapshot } from '../src/core/snapshot';
import {
  currentUid,
  loadDailyRecord,
  loadGrade,
  recordDailyClear,
  rememberedUid,
  saveGrade,
  useStore,
} from '../src/core/storage';

// ---- 代用品 ----

/** 端末ごとの localStorage。current を入れかえると、別の端末になる */
let current = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => current.get(k) ?? null,
    setItem: (k: string, v: string) => void current.set(k, v),
    removeItem: (k: string) => void current.delete(k),
    key: (i: number) => [...current.keys()][i] ?? null,
    get length() {
      return current.size;
    },
  },
});

/** メモリ上の Firestore。fail を true にすると、通信できない状態になる */
class FakeCloud implements Remote {
  data = new Map<string, Snapshot>();
  fail = false;
  writes = 0;
  async load(uid: string) {
    if (this.fail) throw new Error('offline');
    const s = this.data.get(uid);
    return s ? (JSON.parse(JSON.stringify(s)) as Snapshot) : null;
  }
  async save(uid: string, snapshot: Snapshot) {
    if (this.fail) throw new Error('offline');
    this.writes++;
    // 本物と同じく、Firestore の形に変えてからもどす
    this.data.set(uid, fromAppDoc(toAppDoc(snapshot, Date.now())));
  }
}

class FakeAuth implements AuthPort {
  private cb: (uid: string | null) => void = () => {};
  constructor(
    private user: string | null = null,
    private next = 'alice',
  ) {}
  onUser(cb: (uid: string | null) => void) {
    this.cb = cb;
    cb(this.user);
  }
  async signIn() {
    this.user = this.next;
    this.cb(this.user);
  }
  async signOut() {
    this.user = null;
    this.cb(null);
  }
}

const hooks = (answer = true): SyncHooks & { asked: number; data: number } => {
  const h = {
    asked: 0,
    data: 0,
    onStatus() {},
    onData() {
      h.data++;
    },
    askMigrate() {
      h.asked++;
      return answer;
    },
  };
  return h;
};

/** 処理の列が終わるまで待つ */
const settle = async (sync: Sync) => {
  for (let i = 0; i < 5; i++) await sync.flush();
};

const newSync = (cloud: FakeCloud, auth: FakeAuth, h = hooks()) => {
  const sync = new Sync(cloud, auth, h, { debounceMs: 0, retryMs: 10_000 });
  sync.start();
  return sync;
};

beforeEach(() => {
  current = new Map();
  useStore(null);
});

// ---- 記録を合わせる決まり ----

describe('mergeSnapshots', () => {
  const a: Snapshot = { daily: { 3: ['2026-10-01', '2026-10-03'] }, settings: { grade: 3, at: 100 } };
  const b: Snapshot = { daily: { 3: ['2026-10-02', '2026-10-03'], 5: ['2026-10-05'] }, settings: { grade: 5, at: 200 } };

  it('クリアした日は両方を合わせ、学年はあとから変えたほう', () => {
    expect(mergeSnapshots(a, b)).toEqual({
      daily: { 3: ['2026-10-01', '2026-10-02', '2026-10-03'], 5: ['2026-10-05'] },
      settings: { grade: 5, at: 200 },
    });
  });

  it('入れかえても、2 回合わせても同じ', () => {
    const ab = mergeSnapshots(a, b);
    expect(mergeSnapshots(b, a)).toEqual(ab);
    expect(mergeSnapshots(ab, ab)).toEqual(ab);
    expect(mergeSnapshots(ab, a)).toEqual(ab);
  });

  it('まだ学年をえらんでいないほうは、もう一方の学年でおぎなう', () => {
    expect(mergeSnapshots(emptySnapshot(), a).settings.grade).toBe(3);
  });
});

describe('Firestore に保存する形', () => {
  it('もとにもどせる', () => {
    const s: Snapshot = { daily: { 1: ['2026-10-01'], 6: ['2026-10-01', '2026-10-02'] }, settings: { grade: 6, at: 5 } };
    const doc = toAppDoc(s, 0);
    expect(doc.activeDays).toEqual(['2026-10-01', '2026-10-02']);
    expect(doc.completed).toContain('daily-g6-2026-10-02');
    expect(fromAppDoc(doc)).toEqual(s);
  });

  it('形のくずれたデータは読みとばす', () => {
    const s = fromAppDoc({ completed: ['daily-g9-2026-10-01', 'daily-g3-oops', 'daily-g3-2026-10-01', 42 as unknown as string], settings: { grade: 'x' } });
    expect(s).toEqual({ daily: { 3: ['2026-10-01'] }, settings: { grade: null, at: 0 } });
  });
});

// ---- ログインと同期 ----

describe('Sync', () => {
  it('ログインしていなければ、記録はこの端末だけ', async () => {
    const cloud = new FakeCloud();
    const sync = newSync(cloud, new FakeAuth(null));
    recordDailyClear(3, '2026-10-20');
    await settle(sync);
    expect(sync.status).toBe('signed-out');
    expect(cloud.writes).toBe(0);
    expect(loadDailyRecord()[3]).toEqual(['2026-10-20']);
  });

  it('ログインすると、うつすかどうかを聞いて、この端末の記録をアカウントにうつす', async () => {
    recordDailyClear(3, '2026-10-19');
    const cloud = new FakeCloud();
    const h = hooks(true);
    const sync = newSync(cloud, new FakeAuth(null), h);
    await settle(sync); // ログインしていないことが分かってから、ボタンをおす
    await sync.signIn();
    await settle(sync);
    expect(h.asked).toBe(1);
    expect(sync.status).toBe('synced');
    expect(cloud.data.get('alice')?.daily[3]).toEqual(['2026-10-19']);
    expect(currentUid()).toBe('alice');
    expect(loadDailyRecord()[3]).toEqual(['2026-10-19']);
    // うつしたら、ログインなしの記録は消す (二重にうつらないように)
    useStore(null);
    expect(loadDailyRecord()).toEqual({});
  });

  it('うつさないをえらぶと、ログインなしの記録はこの端末に残る', async () => {
    recordDailyClear(3, '2026-10-19');
    const cloud = new FakeCloud();
    const sync = newSync(cloud, new FakeAuth(null), hooks(false));
    await settle(sync); // ログインしていないことが分かってから、ボタンをおす
    await sync.signIn();
    await settle(sync);
    expect(cloud.data.get('alice')?.daily ?? {}).toEqual({});
    useStore(null);
    expect(loadDailyRecord()[3]).toEqual(['2026-10-19']);
  });

  it('ログイン中にクリアした日や学年の変更を Firestore に送る', async () => {
    const cloud = new FakeCloud();
    const sync = newSync(cloud, new FakeAuth('alice'));
    await settle(sync);
    recordDailyClear(4, '2026-10-20');
    saveGrade(4);
    await settle(sync);
    expect(cloud.data.get('alice')).toMatchObject({ daily: { 4: ['2026-10-20'] }, settings: { grade: 4 } });
  });

  it('ほかの端末の記録と合わさる', async () => {
    const cloud = new FakeCloud();
    // 端末 A でクリア
    const a = newSync(cloud, new FakeAuth('alice'));
    await settle(a);
    recordDailyClear(3, '2026-10-19');
    await settle(a);

    // 端末 B (はじめて) でログインすると、A の記録が見える。B でクリアした分も送る
    current = new Map();
    useStore(null);
    const b = newSync(cloud, new FakeAuth('alice'));
    await settle(b);
    expect(loadDailyRecord()[3]).toEqual(['2026-10-19']);
    recordDailyClear(3, '2026-10-20');
    await settle(b);
    expect(cloud.data.get('alice')?.daily[3]).toEqual(['2026-10-19', '2026-10-20']);
  });

  it('通信できないときは offline になり、つながったら送る', async () => {
    const cloud = new FakeCloud();
    const sync = newSync(cloud, new FakeAuth('alice'));
    await settle(sync);
    cloud.fail = true;
    recordDailyClear(3, '2026-10-20');
    await settle(sync);
    expect(sync.status).toBe('offline');
    expect(sync.hasPending()).toBe(true);
    cloud.fail = false;
    await settle(sync);
    expect(sync.status).toBe('synced');
    expect(cloud.data.get('alice')?.daily[3]).toEqual(['2026-10-20']);
  });

  it('送れていない変更があると、ログアウトの前に知らせる', async () => {
    const cloud = new FakeCloud();
    const sync = newSync(cloud, new FakeAuth('alice'));
    await settle(sync);
    cloud.fail = true;
    recordDailyClear(3, '2026-10-20');
    expect(await sync.signOut()).toBe('unsynced');
    expect(sync.uid).toBe('alice');
    expect(await sync.signOut(true)).toBe('ok');
    await settle(sync);
    expect(sync.uid).toBeNull();
  });

  it('ログアウトすると、その人の写しを端末から消して、ログインなしの記録にもどる', async () => {
    recordDailyClear(1, '2026-10-01'); // ログインなしの記録
    const cloud = new FakeCloud();
    const sync = newSync(cloud, new FakeAuth(null), hooks(false));
    await settle(sync); // ログインしていないことが分かってから、ボタンをおす
    await sync.signIn();
    await settle(sync);
    recordDailyClear(5, '2026-10-20');
    saveGrade(5);
    await settle(sync);
    expect(rememberedUid()).toBe('alice');

    await sync.signOut();
    await settle(sync);
    expect(sync.status).toBe('signed-out');
    expect(rememberedUid()).toBeNull();
    expect([...current.keys()].some((k) => k.startsWith('pref-quiz:u:alice:'))).toBe(false);
    expect(loadDailyRecord()).toEqual({ 1: ['2026-10-01'] });
    expect(loadGrade()).toBe(3);
    expect(sameSnapshot(cloud.data.get('alice')!, { daily: { 5: ['2026-10-20'] }, settings: { grade: 5, at: cloud.data.get('alice')!.settings.at } })).toBe(true);
  });

  it('前からの (ログイン機能を入れる前の) 記録の置き場所を、そのまま読める', () => {
    current.set('pref-quiz:grade', '2');
    current.set('pref-quiz:daily', JSON.stringify({ 2: ['2026-10-18'] }));
    expect(loadGrade()).toBe(2);
    expect(loadDailyRecord()).toEqual({ 2: ['2026-10-18'] });
  });
});
