/* eslint-disable no-console */
/**
 * Packs the web export (dist/) into one self-contained HTML file at
 * preview/ownership-map-preview.html, with scripts and styles inlined, so the
 * UAT preview can be opened or hosted anywhere without a server.
 * Run via `npm run build:preview`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
const dist = join(root, 'dist');
const outDir = join(root, 'preview');
const html = readFileSync(join(dist, 'index.html'), 'utf8');

const read = (href: string) => readFileSync(join(dist, href.replace(/^\//, '')), 'utf8');
// Keep inlined code from closing its own tag.
const safe = (code: string) =>
  code.replace(/<\/(script|style)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');

const styles = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(
  (m) => `<style>${safe(read(m[1]!))}</style>`,
);
const scripts = [...html.matchAll(/<script src="([^"]+)" defer><\/script>/g)].map(
  (m) => `<script>${safe(read(m[1]!))}</script>`,
);
const reset = html.match(/<style id="expo-reset">[\s\S]*?<\/style>/)?.[0] ?? '';

// The app routes by path; start at "/" wherever the file is served from.
const routeReset = `<script>try{if(location.pathname!=='/')history.replaceState(null,'','/')}catch(e){}</script>`;

const page = `<title>Ownership Map</title>
<meta name="description" content="UAT preview of Ownership Map with phone and desktop frames. Sample data only.">
${reset}
<style>:root{color-scheme:dark}html,body{height:100%;margin:0;background:#20262E}</style>
${styles.join('\n')}
<div id="root"></div>
${routeReset}
${scripts.join('\n')}
`;

mkdirSync(outDir, { recursive: true });
const out = join(outDir, 'ownership-map-preview.html');
writeFileSync(out, page);
console.log(`Wrote ${out} (${(Buffer.byteLength(page) / 1024 / 1024).toFixed(2)} MB)`);
