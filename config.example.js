const GTM_ID = 'G-XXXXXXXXXX';

// Google ログインと Firestore への保存を使うとき (4 つとも入れる。入れなければ、ログインの入り口は出ない)
const FIREBASE_API_KEY = '…';
const FIREBASE_AUTH_DOMAIN = '….firebaseapp.com';
const FIREBASE_PROJECT_ID = '…';
const FIREBASE_APP_ID = '…';

// たいせん (Realtime Database) を使うとき。上の 4 つも必要。入れなければ、たいせん のボタンは出ない。
// Realtime Database のルールには database.rules.json の prefBattles を入れる
// (同じデータベースを使うほかのアプリのルールと、1 つの "rules" の中に並べる)。
// Authentication で「匿名」のログインも有効にしておく (Google アカウントがなくても遊べるように)。
const FIREBASE_DATABASE_URL = 'https://….firebasedatabase.app';
