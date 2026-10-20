import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import type { HtmlTagDescriptor, Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * Google のタグの ID を決める。
 * 1. 環境変数 GTM_ID があれば、その値 (GitHub Actions では vars.GTM_ID をわたす)
 * 2. なければ、プロジェクト直下の config.js に書かれた GTM_ID
 * どちらもなければタグは埋め込まない。
 */
function readGtmId(): string {
  let value = (process.env.GTM_ID ?? '').trim();
  const file = fileURLToPath(new URL('./config.js', import.meta.url));
  if (!value && existsSync(file)) {
    // const GTM_ID = '…' / export const GTM_ID = "…" / { GTM_ID: '…' } のどの書き方でも読めるよう、
    // 実行はせずに文字として読み取る
    const match = readFileSync(file, 'utf8').match(/\bGTM_ID\b\s*[:=]\s*(['"`])(.*?)\1/);
    value = match ? match[2].trim() : '';
  }
  // HTML にそのまま書きこむので、ID の形をしていないものは受けつけない
  if (value && !/^(GTM|G)-[A-Z0-9]+$/.test(value)) {
    throw new Error(`GTM_ID の形式が正しくありません: "${value}" (GTM-XXXXXXX または G-XXXXXXXXXX)`);
  }
  return value;
}

/** GTM-… なら Google タグ マネージャー、G-… なら Google アナリティクス (gtag.js) のタグ */
function googleTags(id: string): HtmlTagDescriptor[] {
  if (id.startsWith('GTM-')) {
    return [
      {
        tag: 'script',
        injectTo: 'head-prepend',
        children:
          "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});" +
          "var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;" +
          "j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);" +
          `})(window,document,'script','dataLayer','${id}');`,
      },
      {
        tag: 'noscript',
        injectTo: 'body-prepend',
        children: `<iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
      },
    ];
  }
  return [
    {
      tag: 'script',
      injectTo: 'head-prepend',
      attrs: { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${id}` },
    },
    {
      tag: 'script',
      injectTo: 'head-prepend',
      children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`,
    },
  ];
}

function googleTagPlugin(id: string): Plugin {
  return {
    name: 'pref-quiz-google-tag',
    // 本番ビルドのときだけ埋め込む (開発サーバーでアクセスを数えないように)
    apply: 'build',
    transformIndexHtml: () => (id ? googleTags(id) : []),
  };
}

export default defineConfig({
  // 相対パスで出力し、GitHub Pages のサブディレクトリ (/pref-quiz/) でもそのまま配信できるようにする
  base: './',
  plugins: [vue(), googleTagPlugin(readGtmId())],
  build: {
    rolldownOptions: {
      output: {
        // 問題・シルエットのデータ (約 650 kB) はアプリのコードと別のファイルにする。
        // コードだけ直したときは、データをダウンロードしなおさなくてよい
        codeSplitting: { groups: [{ name: 'data', test: /src[\\/]data[\\/]/ }] },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'jsdom',
  },
});
