// 公開用のファイルを dist/ にまとめ、ID があれば index.html に Google のタグを埋め込む
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = `${root}dist/`;
const files = ['index.html', 'style.css', 'script.js', 'questions.json', 'LICENSE'];

/**
 * Google のタグの ID を決める。
 * 1. 環境変数 GTM_ID があれば、その値 (GitHub Actions では vars.GTM_ID をわたす)
 * 2. なければ、プロジェクト直下の config.js に書かれた GTM_ID
 * どちらもなければタグは埋め込まない。
 */
function readGtmId() {
  let value = (process.env.GTM_ID ?? '').trim();
  const file = `${root}config.js`;
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
function googleTags(id) {
  if (id.startsWith('GTM-')) {
    return {
      head:
        "<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});" +
        "var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;" +
        "j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);" +
        `})(window,document,'script','dataLayer','${id}');</script>`,
      body: `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`,
    };
  }
  return {
    head:
      `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>` +
      `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');</script>`,
    body: '',
  };
}

const id = readGtmId();
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
for (const file of files) cpSync(`${root}${file}`, `${dist}${file}`);

if (id) {
  const tags = googleTags(id);
  let html = readFileSync(`${dist}index.html`, 'utf8');
  html = html.replace(/<head>/, `<head>\n    ${tags.head}`);
  if (tags.body) html = html.replace(/<body>/, `<body>\n    ${tags.body}`);
  writeFileSync(`${dist}index.html`, html);
}

console.log(`dist/ に出力しました (Google のタグ: ${id || 'なし'})`);
