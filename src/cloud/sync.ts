import { mergeSnapshots, sameSnapshot } from '../core/merge';
import { emptySnapshot, hasRecords, type Snapshot } from '../core/snapshot';
import {
  clearStore,
  currentUid,
  exportSnapshot,
  importSnapshot,
  onStorageChange,
  rememberUid,
  rememberedUid,
  useStore,
} from '../core/storage';

/** Firestore とのやりとり。テストでは、メモリ上の代用品に差しかえる */
export interface Remote {
  /** その人の記録を読む。まだ何もなければ null */
  load(uid: string): Promise<Snapshot | null>;
  save(uid: string, snapshot: Snapshot): Promise<void>;
}

/** ログインのやりとり */
export interface AuthPort {
  /** ログインの状態が分かったとき・変わったときによばれる。ログインしていなければ null */
  onUser(cb: (uid: string | null) => void): void;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
}

/**
 * loading: ログインしているかどうかを確かめている
 * signed-out: ログインしていない (記録はこの端末だけ)
 * syncing: Firestore に送っている / 取りこんでいる
 * synced: Firestore と同じになっている
 * offline: 送れていない変更がある (つながったら送る)
 */
/**
 * ログインしている人の uid。たいせん のための匿名ログインは、ログインしていないものとして扱う
 * (記録は今までどおり この端末だけに残し、「きろくを うつしますか？」も聞かない)
 */
export function accountUid(user: { uid: string; isAnonymous: boolean } | null): string | null {
  return user && !user.isAnonymous ? user.uid : null;
}

export type SyncStatus = 'loading' | 'signed-out' | 'syncing' | 'synced' | 'offline';

export interface SyncHooks {
  /** 表示している状態 (ログイン中か、ほぞんずみか) が変わった */
  onStatus(): void;
  /** 手元の記録が、取りこみやログイン・ログアウトによって書きかわった (画面をかき直す) */
  onData(): void;
  /** ログインしたとき、この端末にログインなしの記録があった。アカウントにうつすかどうかを聞く */
  askMigrate(): boolean | Promise<boolean>;
}

export interface SyncOptions {
  /** 変更をまとめて送るまでの待ち時間 */
  debounceMs?: number;
  /** 送れなかったとき、次にためすまでの時間 */
  retryMs?: number;
}

/**
 * ログイン中の人の記録を Firestore と合わせる。
 *
 * 画面は今までどおり storage.ts で手元の記録を読み書きする。ここでは、
 * - ログインしたときに、Firestore の記録・この端末にあった写し・(のぞめば) ログインなしの記録を合わせて、
 *   手元と Firestore の両方に書く
 * - そのあとは、手元で書きかわったら少しまとめてから Firestore に送る
 * - 送れなかったら、あとでもう一度ためす
 * 「合わせる」処理 (core/merge.ts) は何回やっても同じ結果になるので、失敗してやり直しても記録はこわれない。
 */
export class Sync {
  uid: string | null = null;
  status: SyncStatus = 'loading';

  private dirty = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private chain: Promise<void> = Promise.resolve();
  private interactive = false;
  /** ログインしたあとの最初の取りこみが、まだすんでいない */
  private needsFull = false;
  private migrate = false;
  private readonly debounceMs: number;
  private readonly retryMs: number;

  constructor(
    private readonly remote: Remote,
    private readonly auth: AuthPort,
    private readonly hooks: SyncHooks,
    opts: SyncOptions = {},
  ) {
    this.debounceMs = opts.debounceMs ?? 2000;
    this.retryMs = opts.retryMs ?? 15000;
  }

  start(): void {
    onStorageChange(() => this.noteChange());
    this.auth.onUser((uid) => {
      void this.enqueue(() => this.handleUser(uid));
    });
  }

  /** ボタンからのログイン。ここから始まったログインのときだけ、記録をうつすかどうかを聞く */
  async signIn(): Promise<void> {
    this.interactive = true;
    try {
      await this.auth.signIn();
    } catch (err) {
      this.interactive = false;
      throw err;
    }
  }

  /** まだ Firestore に送れていない変更があるか */
  hasPending(): boolean {
    return this.uid !== null && (this.dirty || this.needsFull);
  }

  /** たまっている変更を、今すぐ送る */
  flush(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    return this.enqueue(() => this.push());
  }

  /**
   * ログアウトする。送れていない変更があるときは、force を付けないかぎりログアウトせず 'unsynced' を返す
   * (ログアウトすると、この端末の写しを消すので、送れていない分は失われる)。
   */
  async signOut(force = false): Promise<'ok' | 'unsynced'> {
    await this.flush();
    if (this.hasPending() && !force) return 'unsynced';
    await this.auth.signOut();
    return 'ok';
  }

  // ---- ここから下は中の処理 ----

  /** 処理が重ならないよう、1 つずつ順番に行う */
  private enqueue(job: () => Promise<void>): Promise<void> {
    this.chain = this.chain.then(job, job);
    return this.chain;
  }

  private setStatus(status: SyncStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.hooks.onStatus();
  }

  private async handleUser(uid: string | null): Promise<void> {
    if (uid === null) {
      // ログアウトした (または、ログインが切れていた)。この端末の写しを消して、ログインなしの記録にもどす
      const previous = this.uid ?? rememberedUid();
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
      this.dirty = false;
      this.needsFull = false;
      this.interactive = false;
      this.uid = null;
      useStore(null);
      rememberUid(null);
      if (previous) {
        clearStore(previous);
        this.hooks.onData();
      }
      this.setStatus('signed-out');
      return;
    }

    // この端末にログインなしの記録があれば、うつすかどうかを聞く (ボタンからログインしたときだけ)
    const shown = currentUid();
    useStore(null);
    const guestHasRecords = hasRecords(exportSnapshot());
    this.migrate = this.interactive && guestHasRecords && (await this.hooks.askMigrate());
    this.interactive = false;

    this.uid = uid;
    rememberUid(uid);
    useStore(uid);
    this.needsFull = true;
    // まずは、この端末に残っていたその人の写しで画面を出す (はじめての端末なら空)。
    // アプリを開いたときからその人の写しを出していた場合は、かき直さない
    if (shown !== uid) this.hooks.onData();
    await this.push();
  }

  private noteChange(): void {
    if (this.uid === null) return;
    this.dirty = true;
    this.setStatus('syncing');
    this.schedule(this.debounceMs);
  }

  private schedule(ms: number): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.enqueue(() => this.push());
    }, ms);
  }

  private async push(): Promise<void> {
    const uid = this.uid;
    if (uid === null || !this.hasPending()) return;
    this.setStatus('syncing');
    const wasDirty = this.dirty;
    this.dirty = false;
    try {
      await this.syncWith(uid);
      if (this.uid !== uid) return; // 送っている間にログアウトした
      this.setStatus(this.hasPending() ? 'syncing' : 'synced');
    } catch {
      if (this.uid !== uid) return;
      // 送れなかった分は、もう一度送るものとしておぼえておく
      this.dirty ||= wasDirty;
      this.setStatus('offline');
      this.schedule(this.retryMs);
    }
  }

  /**
   * Firestore の記録と手元の記録を合わせて、両方に書く。
   * ほかの端末で進んだ分を消してしまわないよう、送るときも毎回 Firestore の記録と合わせてから書く
   */
  private async syncWith(uid: string): Promise<void> {
    const remote = await this.remote.load(uid);
    if (this.uid !== uid) return;

    let merged = mergeSnapshots(remote ?? emptySnapshot(), exportSnapshot());
    if (this.migrate) {
      useStore(null);
      const guest = exportSnapshot();
      useStore(uid);
      merged = mergeSnapshots(merged, guest);
    }

    const localChanged = !sameSnapshot(merged, exportSnapshot());
    importSnapshot(merged);
    if (!remote || !sameSnapshot(merged, remote)) await this.remote.save(uid, merged);

    // Firestore に入ったのを確かめてから、ログインなしの記録を消す (二重にうつらないように)
    if (this.migrate) {
      clearStore(null);
      this.migrate = false;
    }
    this.needsFull = false;
    if (localChanged && this.uid === uid) this.hooks.onData();
  }
}
