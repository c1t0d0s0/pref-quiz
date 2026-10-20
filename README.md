# 🗾 Japan Prefecture Silhouette & Knowledge Quiz (都道府県シルエット＆ちしきクイズ)

A bright, pop, and fun web-based educational quiz application designed for elementary school students to learn the shapes (silhouettes), trivia, and geography of Japan's 47 prefectures!

[Japanese Version (日本語版 README)](README.ja.md)

---

## ✨ Features

- 🎮 **3 Game Modes**:
  - 🗺️ **Silhouette Quiz (シルエット)**: Guess the prefecture from its vector shape silhouette.
  - 💡 **Knowledge Quiz (ちしき)**: 600+ trivia questions covering geography, landmarks, specialties, population, and records.
  - 🌟 **Mix Quiz (ミックス)**: A fun 10-question random combination of silhouette and knowledge questions.
- 🗺️ **47 Japanese Prefecture SVG Silhouettes**: High-resolution, smooth SVG vector shapes for all 47 prefectures in Japan.
- 📚 **External Questions Dataset (`questions.json`)**: Modularized JSON dataset containing 605 curated, leak-free, and unambiguous trivia questions.
- 🎯 **10-Question Random Quiz**: Each session presents 10 questions with a 30-second countdown timer.
- 🧠 **Smart Shape-Similarity Algorithm**: Distractor options are intelligently picked based on shape similarity to provide a fun and challenging experience.
- 🎨 **Bright & Pop Kid-Friendly Design**: Vibrant pastel color scheme, playful animations, and clean rounded typography ([M PLUS Rounded 1c](https://fonts.google.com/specimen/M+PLUS+Rounded+1c)).
- 🎵 **Web Audio Synthesizer**: Built-in sound effects (correct chime, wrong buzzer, countdown tick-tock, and fanfare) requiring no external audio assets, with an instant mute/unmute toggle.
- 🎊 **Confetti Celebration**: Dynamic canvas confetti animation triggered upon achieving high scores (80+ points).
- 📊 **Google Tag Integration**: At build time, a Google Analytics / Tag Manager tag is embedded when `GTM_ID` is set (env var or `config.js`).
- 📱 **Fully Responsive**: Seamlessly optimized for smartphones, tablets, and desktop displays.

---

## 📁 File Structure

```text
pref-quiz/
├── index.html        # Main HTML skeleton & mode selection UI
├── style.css         # Styling, animations, and responsive design system
├── script.js        # Core quiz logic, SVG dataset, sound synth, and confetti
├── questions.json    # JSON dataset containing 605 knowledge quiz questions
├── config.js         # GTM_ID configuration (Ignored by Git)
├── config.example.js # Example of config.js
├── package.json      # Build script definition (no dependencies)
├── scripts/build.mjs # Outputs dist/ and embeds the Google tag
├── .github/workflows/deploy.yml # Deploys to GitHub Pages on push to main
├── .gitignore        # Git ignore rules (config.js, PROMPT.txt, dist)
├── README.md         # Documentation in English
└── README.ja.md      # Documentation in Japanese
```

---

## 🚀 How to Run Locally

Because this project uses vanilla HTML5, CSS3, and JavaScript (ES6+), no build process or Node.js installation is required.

### 1. Serve via Python HTTP Server
Open your terminal in the project directory and run:
```bash
python3 -m http.server 8080
```

### 2. Open in Browser
Navigate to `http://localhost:8080` in your web browser.

---

## ⚙️ Analytics (Google tag)

The Google tag is embedded into `dist/index.html` at build time only when an ID is set; otherwise nothing is embedded.
An ID starting with `GTM-` produces a Google Tag Manager tag, and `G-` produces a Google Analytics (gtag.js) tag.

- Locally: write `const GTM_ID = 'G-XXXXXXXXXX';` in `config.js` at the project root, then run `npm run build`
- GitHub Pages: register `GTM_ID` under Settings → Secrets and variables → Actions → Variables

The `GTM_ID` environment variable (`vars.GTM_ID` when deploying) takes precedence; otherwise the value in `config.js` is used.
`config.js` is listed in `.gitignore`, so it is never committed.

## 🚢 Deployment (GitHub Pages)

Pushing to `main` runs GitHub Actions (`.github/workflows/deploy.yml`), which builds `dist/` with `npm run build` and publishes it to GitHub Pages.
It can also be run manually from the Actions tab. Set Settings → Pages → Source to "GitHub Actions".

---

## 📜 License

This project is licensed under the MIT License.
