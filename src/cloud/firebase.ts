// Firebase を使う部分は、このファイルだけにまとめる。
// index.ts から「あとで」読みこむので、Firebase を使わない人の最初の表示はおそくならない。
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore/lite';
import { APP_ID, SCHEMA, fromAppDoc, toAppDoc, type AppDoc, type Snapshot } from '../core/snapshot';
import { firebaseApp, firebaseAuth } from './app';
import { accountUid, type AuthPort, type Remote } from './sync';

export function createFirebase(emulator: boolean): { remote: Remote; auth: AuthPort } {
  const auth = firebaseAuth();
  const db = getFirestore(firebaseApp());
  // エミュレーターには本物の Google ログインの画面がないので、テストから「だれとしてログインするか」を
  // 指定できるようにする (window.__testUser)。本番のビルドでは emulator が false なので使われない
  const testHooks = window as unknown as { __testUser?: string };
  if (emulator) connectFirestoreEmulator(db, '127.0.0.1', 8080);

  // users/{uid} と users/{uid}/apps/{appId}
  const userRef = (uid: string) => doc(db, 'users', uid);
  const appRef = (uid: string) => doc(db, 'users', uid, 'apps', APP_ID);

  const remote: Remote = {
    async load(uid): Promise<Snapshot | null> {
      const snap = await getDoc(appRef(uid));
      return snap.exists() ? fromAppDoc(snap.data() as Partial<AppDoc>) : null;
    },
    async save(uid, snapshot) {
      const now = Date.now();
      // その人の情報 (全アプリ共通)。名前やメールアドレスは入れない
      const user = await getDoc(userRef(uid));
      await setDoc(userRef(uid), { schema: SCHEMA, updatedAt: now, ...(user.exists() ? {} : { createdAt: now }) }, { merge: true });
      await setDoc(appRef(uid), toAppDoc(snapshot, now));
    },
  };

  const authPort: AuthPort = {
    onUser(cb) {
      onAuthStateChanged(auth, (user) => cb(accountUid(user)));
    },
    async signIn() {
      if (emulator && testHooks.__testUser) {
        const sub = testHooks.__testUser;
        const token = JSON.stringify({ sub, email: `${sub}@example.com`, email_verified: true });
        await signInWithCredential(auth, GoogleAuthProvider.credential(token));
        return;
      }
      await signInWithPopup(auth, new GoogleAuthProvider());
    },
    async signOut() {
      await signOut(auth);
    },
  };

  return { remote, auth: authPort };
}
