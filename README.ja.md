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
- 📒 **スタンプカード**: 今日のチャレンジをさいごまでやると、その日にスタンプが押されます。学年ごとの月のカレンダーで、1年前までさかのぼって見られます。スタンプの絵は日によって変わる都道府県のシルエットです。
- 🎮 **選べる3つのゲームモード**:
  - 🗺️ **シルエットクイズ**: 都道府県の形（影絵）を当てるモード
  - 💡 **ちしきクイズ**: 全773問のちしき問題から出題される文章クイズモード
  - 🌟 **ミックスクイズ**: シルエット問題と知識問題がランダムに10問出題されるモード
- 🗺️ **全47都道府県のSVGシルエット**: 高精細かつ滑らかなSVGベクトルデータで描画。
- 📚 **学年別の問題データ**: 全773問のちしき問題を、学年ごとの JSON ファイル（`src/data/questions/grade1.json` 〜 `grade6.json`）で管理。
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
│   ├── components/
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
│   ├── core/                   # 画面に依存しない処理（テストしやすいように分けてある）
│   │   ├── quiz.ts             # 問題の組み立て・4択の選択肢・称号
│   │   ├── daily.ts            # 今日のチャレンジの出題（日付と学年から10問を決める）
│   │   ├── stamps.ts           # スタンプカードのカレンダー・スタンプの絵
│   │   ├── storage.ts          # 学年・クリアした日の保存（localStorage）
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
├── vite.config.ts              # Vite の設定・Google のタグの埋め込み
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
{ "id": 774, "prefId": 1, "prefName": "北海道", "category": "特産品・名物", "question": "…は どこ？", "explanation": "…だよ！" }
```

- `id` は全学年を通して重ならない番号にします（いちばん大きい番号の次）
- `prefId` は答えの都道府県の番号（`src/data/prefectures.json` の `id`）、`prefName` はその名前です
- 答えはいつも都道府県です。問題文に出てくる都道府県は、まちがいの選択肢に入りません

学年ごとの目安:

- 1年: ひらがな中心で、だれでも知っている有名なもの
- 2年: 有名な食べ物・名所・キャラクター
- 3年: 名所・観光地、特産品
- 4年: 県庁所在地、地方、山・川・湖などの地理
- 5年: 農業・水産業・工業、気候、くわしい特産品
- 6年: 歴史・文化、世界遺産

追加したら `npm test` で、項目のぬけ・`id` の重複・都道府県の番号と名前・学年ごとの問題数（100問以上）・今日のチャレンジの出題を確かめられます。
問題を追加・削除すると、その学年の今日のチャレンジの順番が変わります（その日の問題も変わるので、公開は日本時間の夜中がおすすめです）。

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
