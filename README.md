# 🗾 Japan Prefecture Silhouette & Knowledge Quiz (都道府県シルエット＆ちしきクイズ)

A bright, pop, and fun web-based educational quiz application designed for elementary school students to learn the shapes (silhouettes), trivia, and geography of Japan's 47 prefectures!

[Japanese Version (日本語版 README)](README.ja.md)

---

## ✨ Features

- 📅 **Daily Challenge by Grade (今日のチャレンジ)**: Pick a school grade (1–6) and get 10 grade-appropriate questions every day.
  - The same date and grade always give the same 10 questions for everyone (the date changes at midnight JST).
  - Each grade has 100+ questions; no question repeats until the whole set has been used, and no prefecture is the answer twice on the same day.
  - Grades 1–2 use mostly hiragana and show furigana on the choices; upper grades mix in similar-shaped prefectures as wrong choices.
  - Cleared days and the current streak are saved in this browser (localStorage). Replays are allowed.
- 📒 **Stamp Card (スタンプカード)**: Finishing the daily challenge stamps that day on a per-grade monthly calendar, viewable up to a year back. Each day's stamp is a prefecture silhouette chosen by date.
- 🎮 **3 Game Modes**:
  - 🗺️ **Silhouette Quiz (シルエット)**: Guess the prefecture from its vector shape silhouette.
  - 💡 **Knowledge Quiz (ちしき)**: 770+ trivia questions covering geography, landmarks, specialties, population, and records.
  - 🌟 **Mix Quiz (ミックス)**: A fun 10-question random combination of silhouette and knowledge questions.
- 🗺️ **47 Japanese Prefecture SVG Silhouettes**: High-resolution, smooth SVG vector shapes for all 47 prefectures in Japan.
- 📚 **Per-Grade Question Data**: 773 knowledge questions kept in one JSON file per school grade (`src/data/questions/grade1.json` … `grade6.json`).
- 🎯 **10-Question Random Quiz**: Each session presents 10 questions with a 30-second countdown timer.
- 🧠 **Smart Shape-Similarity Algorithm**: Distractor options are intelligently picked based on shape similarity to provide a fun and challenging experience.
- 🎨 **Chalkboard Design**: A wooden-framed chalkboard look with handwritten fonts ([Klee One](https://fonts.google.com/specimen/Klee+One), [Yomogi](https://fonts.google.com/specimen/Yomogi)) and a sparrow mascot.
- 🎵 **Web Audio Synthesizer**: Built-in sound effects (correct chime, wrong buzzer, countdown tick-tock, and fanfare) requiring no external audio assets, with an instant mute/unmute toggle.
- 🎊 **Confetti Celebration**: Dynamic canvas confetti animation triggered upon achieving high scores (80+ points).
- 📊 **Google Tag Integration**: At build time, a Google Analytics / Tag Manager tag is embedded when `GTM_ID` is set (env var or `config.js`).
- 📱 **Fully Responsive**: Seamlessly optimized for smartphones, tablets, and desktop displays.

---

## 📁 File Structure

Built with [Vue 3](https://vuejs.org/) single-file components and TypeScript, bundled by [Vite](https://vite.dev/), and tested with [Vitest](https://vitest.dev/).

```text
pref-quiz/
├── index.html                  # Minimal HTML that mounts the Vue app
├── src/
│   ├── main.ts                 # App entry point
│   ├── App.vue                 # Screen flow (start → quiz → result), grade, daily record
│   ├── types.ts                # Shared types (grade, prefecture, question, quiz)
│   ├── components/             # StartScreen, DailyPanel, QuizScreen, QuestionCard, TimerBar,
│   │                           # ResultScreen, ReviewList, StampScreen, StampCard, StampMark, SparrowIcon
│   ├── core/                   # UI-independent logic (easy to unit test)
│   │   ├── quiz.ts             # Building quizzes, 4-choice options, ranks
│   │   ├── daily.ts            # Daily challenge selection (10 questions from date and grade)
│   │   ├── stamps.ts           # Stamp card calendar and stamp pictures
│   │   ├── storage.ts          # Saved grade and cleared days (localStorage)
│   │   ├── date.ts / rng.ts    # JST dates, seeded random numbers
│   │   ├── sound.ts            # Sound effects (Web Audio API)
│   │   └── confetti.ts         # Confetti animation
│   ├── data/
│   │   ├── index.ts            # Data access (import from here)
│   │   ├── prefectures.json    # 47 prefectures (name, reading, region, capital, hint)
│   │   ├── shapes.json         # Prefecture silhouettes (SVG paths)
│   │   ├── similar.ts          # Similar-shaped prefectures (used as wrong choices)
│   │   └── questions/grade1–6.json  # Knowledge questions, one file per grade
│   └── styles/main.css         # Styles (chalkboard design)
├── public/                     # Files served as-is (favicon.svg / favicon.ico / apple-touch-icon.png)
├── tests/                      # Vitest tests (data, daily selection, options, quiz screen)
├── vite.config.ts              # Vite config and Google tag injection
├── config.example.js           # Example of config.js (config.js is git-ignored)
└── .github/workflows/deploy.yml  # Deploys to GitHub Pages on push to main
```

---

## 🚀 How to Run Locally

Requires Node.js 24.

```bash
npm install
npm run dev      # Dev server (http://localhost:5173) with instant reload
npm test         # Run tests
npm run build    # Type-check, then output the site to dist/
npm run preview  # Serve the built dist/ locally
```

---

## 📝 Adding Questions

Add entries to the file for the grade that should get the question, `src/data/questions/grade1.json` … `grade6.json`. The grade comes from the file, so it is not written in each question.

```json
{ "id": 774, "prefId": 1, "prefName": "北海道", "category": "特産品・名物", "question": "…は どこ？", "explanation": "…だよ！" }
```

- `id` must be unique across all grades (use the next number after the largest one).
- `prefId` is the answer prefecture's `id` from `src/data/prefectures.json`, and `prefName` is its name.
- The answer is always a prefecture. Prefectures mentioned in the question text are never used as wrong choices.

Run `npm test` afterwards. It checks required fields, unique `id`s, `prefId`/`prefName` consistency, at least 100 questions per grade, and the daily selection.
Adding or removing questions changes the order of that grade's daily challenge, including today's set, so deploying around midnight JST is best.

## ⚙️ Analytics (Google tag)

The Google tag is embedded into `dist/index.html` at build time only when an ID is set; otherwise nothing is embedded.
An ID starting with `GTM-` produces a Google Tag Manager tag, and `G-` produces a Google Analytics (gtag.js) tag.

- Locally: write `const GTM_ID = 'G-XXXXXXXXXX';` in `config.js` at the project root, then run `npm run build`
- GitHub Pages: register `GTM_ID` under Settings → Secrets and variables → Actions → Variables

The `GTM_ID` environment variable (`vars.GTM_ID` when deploying) takes precedence; otherwise the value in `config.js` is used.
`config.js` is listed in `.gitignore`, so it is never committed.

## 🚢 Deployment (GitHub Pages)

Pushing to `main` runs GitHub Actions (`.github/workflows/deploy.yml`), which runs `npm ci` and `npm test`, then builds `dist/` with `npm run build` and publishes it to GitHub Pages.
It can also be run manually from the Actions tab. Set Settings → Pages → Source to "GitHub Actions".

---

## 📜 License

This project is licensed under the MIT License.
