# 🗾 都道府県シルエット＆ちしきクイズ (Japan Prefecture Silhouette & Knowledge Quiz)

日本の47都道府県の「形（シルエット）」や「特産品・名所・歴史・日本一の記録（全700問以上）」を楽しく学べる、小学生向けの明るくポップなWebクイズゲームです！

[English Version (英語版 README)](README.md)

---

## ✨ 主な特徴・機能

- 📅 **学年別「今日のチャレンジ」**: 1〜6年生の学年を選ぶと、その学年に合った問題が毎日10問出題されます。
  - 日付と学年が同じなら、だれが開いても同じ10問になります（日本時間で日付が変わります）。
  - 学年ごとに100問以上のストックがあり、全部の問題が1回ずつ出るまで同じ問題は出ません。同じ日に同じ都道府県が答えの問題が重ならないようにならべています。
  - 1・2年生はひらがな中心の問題で、選択肢の都道府県名にふりがながつきます。高学年ほど形の似た都道府県が選択肢にまざり、むずかしくなります。
  - クリアした日と連続日数は、この端末（localStorage）に保存されます。何回でも挑戦できます。
- 🔑 **Google でログイン（任意）**: ログインすると記録が Firestore に保存され、ほかのブラウザや端末でも同じ記録で遊べます。ログインしなくても、そのブラウザに保存して遊べます。
- ⚔️ **シルエット たいせん（オンライン）**: 2〜8人が それぞれの端末から同じ部屋に入り、同じシルエットを見て、正しい都道府県を一番早く選んだ人が札をとります（意味かるた たいせん と同じ遊び方）。選択肢は6つ。部屋には 5けたのコード・QRコード・URL で入れます。Google アカウントはいりません。
- 📒 **スタンプカード**: 今日のチャレンジをさいごまでやると、その日にスタンプが押されます。学年ごとの月のカレンダーで、1年前までさかのぼって見られます。スタンプの絵は日によって変わる都道府県のシルエットです。
- 🎮 **選べる3つのゲームモード**:
  - 🗺️ **シルエットクイズ**: 都道府県の形（影絵）を当てるモード
  - 💡 **ちしきクイズ**: 全768問のちしき問題から出題される文章クイズモード
  - 🌟 **ミックスクイズ**: シルエット問題と知識問題がランダムに10問出題されるモード
- 🗺️ **全47都道府県のSVGシルエット**: 高精細かつ滑らかなSVGベクトルデータで描画。
- 📚 **学年別の問題データ**: 全768問のちしき問題を、学年ごとの JSON ファイル（`src/data/questions/grade1.json` 〜 `grade6.json`）で管理。
- 🎯 **10問ランダム出題＆30秒タイマー**: 毎回10問がシャッフル出題され、1問につき30秒のカウントダウンタイマーが作動します。
- 🧠 **類似形状のダミー選択肢アルゴリズム**: 形が似ている・間違いやすい都道府県（例: 鹿児島県 vs 青森県 vs 愛知県）が優先的に選択肢に含まれるため、歯ごたえのある難易度を提供します。
- 🎨 **黒板デザイン**: 木わくの黒板にチョークで書いたような画面。手書き風フォント（[Klee One](https://fonts.google.com/specimen/Klee+One)・[Yomogi](https://fonts.google.com/specimen/Yomogi)）とスズメのキャラクター。
- 🎵 **Web Audio API 効果音**: 外部音声ファイル不要の軽量サウンドエンジン（正解ピンポン♪、不正解ブブー、カウントダウン、ファンファーレ）を搭載（ミュート切り替え付き）。
- 🎊 **紙吹雪（Confetti）演出**: 高得点（80点以上）達成時に画面全体に華やかなカラー紙吹雪が舞うアニメーション。
- 📊 **Google のタグ連携**: ビルド時に `GTM_ID`（環境変数 または `config.js`）があれば、Google アナリティクス / タグ マネージャーのタグを埋め込み。
- 📱 **完全レスポンシブ対応**: スマートフォン、タブレット、PCのどの画面サイズでもきれいに表示・操作可能。

---

## 📁 ファイル構成

[Vue 3](https://vuejs.org/)（単一ファイルコンポーネント）+ TypeScript で作り、[Vite](https://vite.dev/) でビルド、[Vitest](https://vitest.dev/) でテストします。

```text
pref-quiz/
├── index.html                  # Vue をマウントするだけの HTML
├── src/
│   ├── main.ts                 # アプリの起動
│   ├── App.vue                 # 画面の切りかえ（スタート → クイズ → 結果）・学年・今日のチャレンジの記録
│   ├── types.ts                # 型（学年・都道府県・問題・クイズ）
│   ├── battle/battle.ts        # たいせん の決まりごと（問題と6つの選択肢・札・おてつき・順位）
│   ├── components/
│   │   ├── battle/             # たいせん の画面（入口・待ち画面・たいせん中・結果）
│   │   ├── StartScreen.vue     # スタート画面（じゆうに あそぶモードの選択）
│   │   ├── DailyPanel.vue      # 今日のチャレンジ（学年の選択・クリア状況）
│   │   ├── QuizScreen.vue      # クイズ画面（タイマー・答えの受けつけ）
│   │   ├── QuestionCard.vue    # 問題の表示（シルエット / ちしき）
│   │   ├── TimerBar.vue        # のこり時間のバー
│   │   ├── ResultScreen.vue    # 結果画面（点数・称号）
│   │   ├── ReviewList.vue      # ふりかえり
│   │   ├── StampScreen.vue     # スタンプカードの画面
│   │   ├── StampCard.vue       # スタンプカード（月のカレンダー）
│   │   ├── StampMark.vue       # スタンプ1つ（都道府県のシルエット）
│   │   └── SparrowIcon.vue     # スズメのキャラクター
│   ├── cloud/                  # Google ログインと Firestore との同期（firebase.ts）、たいせん の通信（battle-net.ts）
│   ├── core/                   # 画面に依存しない処理（テストしやすいように分けてある）
│   │   ├── quiz.ts             # 問題の組み立て・選択肢（4択 / たいせん は6択）・称号
│   │   ├── daily.ts            # 今日のチャレンジの出題（日付と学年から10問を決める）
│   │   ├── stamps.ts           # スタンプカードのカレンダー・スタンプの絵
│   │   ├── storage.ts          # 学年・クリアした日の保存（localStorage）
│   │   ├── snapshot.ts / merge.ts  # Firestore に保存する形と、2 か所の記録の合わせ方
│   │   ├── date.ts / rng.ts    # 日本時間の日付・種つき乱数
│   │   ├── sound.ts            # 効果音（Web Audio API）
│   │   └── confetti.ts         # 紙ふぶき
│   ├── data/
│   │   ├── index.ts            # データの読みこみ（ここから使う）
│   │   ├── prefectures.json    # 47都道府県（名前・よみ・地方・県庁所在地・ヒント）
│   │   ├── shapes.json         # 都道府県のシルエット（SVG パス）
│   │   ├── similar.ts          # 形が似ている都道府県（まちがいの選択肢に使う）
│   │   └── questions/grade1〜6.json  # ちしき問題（学年ごと）
│   └── styles/main.css         # スタイル（黒板デザイン）
├── public/                     # そのまま公開するファイル（favicon.svg / favicon.ico / apple-touch-icon.png）
├── tests/                      # Vitest のテスト（データ・出題・選択肢・クイズ画面）
├── vite.config.ts              # Vite の設定・Google のタグの埋め込み・Firebase の設定の読みこみ
├── firestore.rules / database.rules.json / firebase.json  # Firestore・Realtime Database のルールとエミュレーターの設定
├── config.example.js           # config.js の見本（config.js は .gitignore 対象）
└── .github/workflows/deploy.yml  # main への push で GitHub Pages に公開
```

---

## 🚀 使い方（ローカル実行方法）

Node.js 24 が必要です。

```bash
npm install
npm run dev      # 開発サーバー（http://localhost:5173）。ファイルを保存するとすぐ画面に反映されます
npm test         # テスト
npm run build    # 型チェックのあと dist/ に公開用のファイルを出力
npm run preview  # ビルドした dist/ を手元で確認
```

---

## 📝 問題を追加する

出題したい学年のファイル `src/data/questions/grade1.json` 〜 `grade6.json` に、次の形で1問ずつ追加します。学年はファイルで決まるので、問題には書きません。

```json
{ "id": 845, "prefId": 1, "prefName": "北海道", "category": "特産品・名物", "question": "…は どこ？", "explanation": "…だよ！" }
```

- `id` は全学年を通して重ならない番号にします（いちばん大きい番号の次）
- `prefId` は答えの都道府県の番号（`src/data/prefectures.json` の `id`）、`prefName` はその名前です
- 答えはいつも都道府県です。問題文に出てくる都道府県は、まちがいの選択肢に入りません

学年ごとの目安:

- 1年: ひらがな中心で、だれでも知っている有名なもの
- 2年: 有名な食べ物・名所・キャラクター
- 3年: 名所・観光地、特産品（テレビや旅行で見聞きする有名なもの。3年生はまだ都道府県を習っていない）
- 4年: 県庁所在地、地方、山・川・湖などの地理
- 5年: 農業・水産業・工業、気候、くわしい特産品
- 6年: 歴史・文化、世界遺産

同じ分野でも、ご当地グルメや小さな観光地のように大人でも知らない題材は、その学年の学習内容に合うときだけ入れます。

追加したら `npm test` で、項目のぬけ・`id` の重複・都道府県の番号と名前・学年ごとの問題数（100問以上）・今日のチャレンジの出題を確かめられます。
問題を追加・削除すると、その学年の今日のチャレンジの順番が変わります（その日の問題も変わるので、公開は日本時間の夜中がおすすめです）。

## 🔑 ログインと記録の保存 (Firebase)

Google でログインした人の記録は Firebase の Firestore に保存し、どのブラウザや端末でも同じ記録で遊べます。
ログインしない人の記録は、そのブラウザの localStorage だけに保存します。しくみはスズメの社会クイズ (social-studies-quiz) と同じです。

- 画面はいつも手元 (localStorage) の記録を読み書きする (`src/core/storage.ts`)。
  ログインなしの記録は `pref-quiz:…` (ログイン機能を入れる前と同じ場所)、ログイン中の人の写しは `pref-quiz:u:<uid>:…`
- ログイン中は、書きかわった分を少しまとめてから Firestore に送る (`src/cloud/sync.ts`)。
  ログインしたとき・ページを開いたときは、Firestore の記録と手元の写しを合わせて、両方に書く (`src/core/merge.ts`)
- ログインしたとき、その端末にログインなしの記録があれば、アカウントにうつすかどうかを聞く。ログアウトすると、その人の写しは端末から消す
- **Firebase の設定を入れていないビルドでは、ログインの入り口は出ず、Firebase のコードも読みこまれません**
- 通信できないときも手元の写しで遊べ、つながったときに送る。送れていない変更があるままログアウトしようとすると、たしかめる

2 か所の記録の合わせ方は、何回合わせても同じ結果になるように決めてあります。2 台で別々に遊んでも、
通信に失敗してやり直しても、記録が消えたり二重にふえたりしません。

| 記録 | 合わせ方 |
|---|---|
| 今日のチャレンジをクリアした日 (学年ごと) | 両方を合わせた集合 (学年ごとに新しい 400 日分) |
| えらんだ学年 | あとから変えたほう |

Firestore の形は、小学生向けの学習アプリで共通にしてあり、記録はアプリごとの `appId` の下に分けて保存します。
このアプリの `appId` は `pref-quiz` なので、ほかのアプリと同じ Firebase プロジェクトを使っても、記録はまざりません。

```
users/{uid}                  その人の情報 (名前・メールアドレス・写真は保存しない)
users/{uid}/apps/pref-quiz   今日のチャレンジをクリアした日 (activeDays)、
                             クリアした学年と日 (completed: daily-g3-2026-10-20 のような形)、設定 (settings: 学年)
```

設定値は `config.js` (手元) か、同じ名前の環境変数 (GitHub Actions では Variables) で入れます (`config.example.js` を参照)。
4 つの値は Firebase コンソールの「ウェブアプリの設定」にあります。

```js
const FIREBASE_API_KEY = '…';
const FIREBASE_AUTH_DOMAIN = '….firebaseapp.com';
const FIREBASE_PROJECT_ID = '…';
const FIREBASE_APP_ID = '…';
```

Firebase コンソールでは、Authentication で Google ログインを有効にし、承認済みドメインに公開先を足し、
Firestore のルールに `firestore.rules` の内容を設定します (ログインしている本人だけが、自分の記録を読み書きできる)。
スズメの社会クイズと同じプロジェクトを使う場合、ルールは同じ内容なので、そのままで動きます。

### ログインできないとき

ログインに失敗すると、ボタンの下に「ログインできませんでした (auth/…)」と、Firebase のエラーの名前が出ます。

| エラーの名前 | 原因 | 直し方 |
|---|---|---|
| `auth/configuration-not-found` | そのプロジェクトで Authentication がまだ始まっていない | Firebase コンソール → Authentication →「始める」をおし、ログイン方法で Google を有効にする |
| `auth/operation-not-allowed` | Google でのログインが有効になっていない | Authentication → ログイン方法 → Google を有効にして保存する |
| `auth/unauthorized-domain` | 開いているサイトのドメインが登録されていない | Authentication → 設定 → 承認済みドメイン に、公開先のドメイン (手元なら `localhost`) を足す |
| `auth/popup-blocked` | ブラウザがログインの画面 (ポップアップ) を止めた | ブラウザでこのサイトのポップアップをゆるす |
| `auth/invalid-api-key` など | 設定値がまちがっている | 4 つの設定値を、コンソールの「ウェブアプリの設定」からコピーし直す |

ログインはできるのに「まだ ほぞんできていません」のままのときは、Firestore Database がまだ作られていないか、
ルールが `firestore.rules` の内容になっていません。

13 歳未満の子どもの Google アカウントは、保護者の管理 (ファミリー リンク) が前提です。保護者のアカウントでログインして使うこともできます。

### エミュレーターで動かす (開発用)

本物の Firebase を使わずに、手元でログインと保存をためせます (Java が必要)。

```sh
npx firebase-tools emulators:start --only auth,firestore,database --project demo-pref-quiz
FIREBASE_API_KEY=x FIREBASE_AUTH_DOMAIN=localhost FIREBASE_PROJECT_ID=demo-pref-quiz FIREBASE_APP_ID=x \
  FIREBASE_DATABASE_URL=https://demo-pref-quiz-default-rtdb.firebaseio.com FIREBASE_EMULATOR=1 npm run dev
```

エミュレーターには Google のログイン画面がないので、ブラウザの開発者ツールで `window.__testUser = 'test-user'` としてから
「Googleで ログイン」をおすと、その名前のユーザーとしてログインします。

## ⚔️ シルエット たいせん (Firebase Realtime Database)

kanji-quiz の「意味かるた たいせん」と同じしくみの、オンラインの早押し たいせん です。

- ホストが部屋を作り (5・10・20問)、ほかの人は 5けたのコード・QRコード・招待の URL (`?battle=12345`) で入る。2〜8人
- ホストが スタート を押すと、3.5秒のカウントダウンのあと、全員に同じシルエットと 6つの選択肢が出る
- 一番早く正解した人が札をとる。まちがえると「おてつき」で、その問題はもう答えられない
- だれかがとるか、全員がおてつきするか、15秒たつと答えを見せ、2秒後に次の問題になる (進めるのはホストの端末)
- 結果は、札の多い順 (同じなら おてつきの少ない順)。ホストは「もう一度」で、同じ部屋で次の回を始められる
- 問題と選択肢は部屋の seed から作るので、どの端末でも同じ。まちがいの選択肢 5つのうち 2つは、形の似ている都道府県
- Google アカウントはいらない (匿名でログインする)。匿名ログインは「ログイン中」にはならず、記録やスタンプには何も残らない

部屋は Realtime Database の `prefBattles/{コード}` に置きます (kanji-quiz の `kanjiBattles` などとは分けてあります)。
部屋を作った人が出ると部屋ごと消え、1日以上前の部屋はだれでも上書きできます。

```
prefBattles/{code}
  app: 'pref-quiz', hostUid, createdAt, count, version, round, seed, status, startAt, q, qAt
  players/{seat}: { uid, name, joinedAt, online }
  takes/{q}: { seat, round, at }      一番早く正解した人 (トランザクションで1人だけ)
  faults/{q}/{seat}: true             おてつき
```

使うには、Firebase の 4 つの値に加えて `FIREBASE_DATABASE_URL` を入れます (`config.js` か、同じ名前の環境変数 / GitHub の Variables)。
入れなければ、たいせん のボタンは出ません。Firebase コンソールでは、次の 2 つを設定します。

1. Realtime Database → ルール に、`database.rules.json` の `prefBattles` を入れる。
   ルールはデータベースに 1 つだけなので、同じデータベースを使うほかのアプリ (`kanjiBattles`・`mathBattles`・`battles`) の
   ルールと、1 つの `"rules"` の中に並べて置く
2. Authentication → ログイン方法 で「匿名」を有効にする

- 名前は 10 文字まで。対戦コードを知っている人にだけ見え、部屋が消えるといっしょに消えます
- 答え合わせは各端末で行うので、ずるを完全には防げません。友だちや家族どうしで遊ぶためのものです

## ⚙️ アクセス解析 (Google のタグ)

ID を設定したときだけ、ビルド時に Google のタグを `dist/index.html` に埋め込みます。設定しなければ何も埋め込みません。
ID が `GTM-…` なら Google タグ マネージャー、`G-…` なら Google アナリティクス (gtag.js) のタグになります。

- 手元: プロジェクト直下の `config.js` に `const GTM_ID = 'G-XXXXXXXXXX';` のように書き、`npm run build` を実行する
- GitHub Pages: リポジトリの Settings → Secrets and variables → Actions → Variables に `GTM_ID` を登録する

環境変数 `GTM_ID` (デプロイ時は `vars.GTM_ID`) があればそれを使い、なければ `config.js` の値を使います。
※ `config.js` は `.gitignore` に指定されているため、コミットされません。

## 🚢 デプロイ (GitHub Pages)

`main` ブランチに push すると、GitHub Actions (`.github/workflows/deploy.yml`) が `npm ci`・`npm test` のあと `npm run build` で `dist/` を作り、GitHub Pages に公開します。
Actions の画面から手動で実行することもできます。リポジトリの Settings → Pages の Source は「GitHub Actions」にしてください。

---

## 📜 ライセンス

MIT License
