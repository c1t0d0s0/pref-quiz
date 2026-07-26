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
- 📊 **Google Tag Manager Integration**: Analytics tracking loaded dynamically from `config.js`.
- 📱 **Fully Responsive**: Seamlessly optimized for smartphones, tablets, and desktop displays.

---

## 📁 File Structure

```text
pref-quiz/
├── index.html        # Main HTML skeleton, mode selection UI & GTM tag initializer
├── style.css         # Styling, animations, and responsive design system
├── script.js        # Core quiz logic, SVG dataset, sound synth, and confetti
├── questions.json    # JSON dataset containing 605 knowledge quiz questions
├── config.js         # Configuration file for GTM Measurement ID (Ignored by Git)
├── .gitignore        # Git ignore rules (ignores config.js and PROMPT.txt)
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

## ⚙️ Configuration & Analytics

To configure Google Tag Manager / Analytics, set your Measurement ID inside `config.js`:
```javascript
window.GTAG_ID = "G-S6QX2XHT2D";
```
`config.js` is included in `.gitignore` by default so that sensitive tracking keys are not committed to source control.

---

## 📜 License

This project is licensed under the MIT License.
