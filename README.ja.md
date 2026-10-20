# 🗾 都道府県シルエット＆ちしきクイズ (Japan Prefecture Silhouette & Knowledge Quiz)

日本の47都道府県の「形（シルエット）」や「特産品・名所・歴史・日本一の記録（全600問以上）」を楽しく学べる、小学生向けの明るくポップなWebクイズゲームです！

[English Version (英語版 README)](README.md)

---

## ✨ 主な特徴・機能

- 🎮 **選べる3つのゲームモード**:
  - 🗺️ **シルエットクイズ**: 都道府県の形（影絵）を当てるモード
  - 💡 **ちしきクイズ**: 全605問の独立問題データ（`questions.json`）から出題される文章クイズモード
  - 🌟 **ミックスクイズ**: シルエット問題と知識問題がランダムに10問出題されるモード
- 🗺️ **全47都道府県のSVGシルエット**: 高精細かつ滑らかなSVGベクトルデータで描画。
- 📚 **外部JSON問題データベース (`questions.json`)**: 全605問の厳選された知識クイズデータを非同期読み込みを行うモジュール構成。
- 🎯 **10問ランダム出題＆30秒タイマー**: 毎回10問がシャッフル出題され、1問につき30秒のカウントダウンタイマーが作動します。
- 🧠 **類似形状のダミー選択肢アルゴリズム**: 形が似ている・間違いやすい都道府県（例: 鹿児島県 vs 青森県 vs 愛知県）が優先的に選択肢に含まれるため、歯ごたえのある難易度を提供します。
- 🎨 **小学生向けポップデザイン**: 明るいパステルカラー、丸みのあるボタン、可愛いフォント（[M PLUS Rounded 1c](https://fonts.google.com/specimen/M+PLUS+Rounded+1c)）を採用。
- 🎵 **Web Audio API 効果音**: 外部音声ファイル不要の軽量サウンドエンジン（正解ピンポン♪、不正解ブブー、カウントダウン、ファンファーレ）を搭載（ミュート切り替え付き）。
- 🎊 **紙吹雪（Confetti）演出**: 高得点（80点以上）達成時に画面全体に華やかなカラー紙吹雪が舞うアニメーション。
- 📊 **Google のタグ連携**: ビルド時に `GTM_ID`（環境変数 または `config.js`）があれば、Google アナリティクス / タグ マネージャーのタグを埋め込み。
- 📱 **完全レスポンシブ対応**: スマートフォン、タブレット、PCのどの画面サイズでもきれいに表示・操作可能。

---

## 📁 ファイル構成

```text
pref-quiz/
├── index.html        # アプリの骨格・モード選択タブ
├── style.css         # スタイル・アニメーション・レスポンシブCSS
├── script.js        # 都道府県SVGデータ・クイズ制御ロジック・音源・紙吹雪
├── questions.json    # 知識クイズの問題データベース（605問）
├── config.js         # GTM_ID 設定ファイル（.gitignore対象）
├── config.example.js # config.js の見本
├── package.json      # ビルド用スクリプト定義（依存パッケージなし）
├── scripts/build.mjs # dist/ への出力と Google のタグの埋め込み
├── .github/workflows/deploy.yml # main への push で GitHub Pages に公開
├── .gitignore        # Git非管理ファイル指定 (config.js, PROMPT.txt, dist)
├── README.md         # 英語版ドキュメント
└── README.ja.md      # 日本語版ドキュメント
```

---

## 🚀 使い方（ローカル実行方法）

本アプリは Vanilla HTML5 / CSS3 / JavaScript (ES6+) で構成されているため、Node.js やビルドツールのインストールは不要です。

### 1. ローカルサーバーの起動
ターミナルでプロジェクトフォルダに移動し、以下のコマンドを実行します。
```bash
python3 -m http.server 8080
```

### 2. ブラウザでアクセス
ブラウザを開き、`http://localhost:8080` にアクセスしてください。

---

## ⚙️ アクセス解析 (Google のタグ)

ID を設定したときだけ、ビルド時に Google のタグを `dist/index.html` に埋め込みます。設定しなければ何も埋め込みません。
ID が `GTM-…` なら Google タグ マネージャー、`G-…` なら Google アナリティクス (gtag.js) のタグになります。

- 手元: プロジェクト直下の `config.js` に `const GTM_ID = 'G-XXXXXXXXXX';` のように書き、`npm run build` を実行する
- GitHub Pages: リポジトリの Settings → Secrets and variables → Actions → Variables に `GTM_ID` を登録する

環境変数 `GTM_ID` (デプロイ時は `vars.GTM_ID`) があればそれを使い、なければ `config.js` の値を使います。
※ `config.js` は `.gitignore` に指定されているため、コミットされません。

## 🚢 デプロイ (GitHub Pages)

`main` ブランチに push すると、GitHub Actions (`.github/workflows/deploy.yml`) が `npm run build` で `dist/` を作り、GitHub Pages に公開します。
Actions の画面から手動で実行することもできます。リポジトリの Settings → Pages の Source は「GitHub Actions」にしてください。

---

## 📜 ライセンス

MIT License
