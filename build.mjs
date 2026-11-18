import { build } from 'esbuild';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

await mkdir('assets', { recursive: true });
const result = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  target: ['chrome120', 'edge120'],
  minify: true,
  legalComments: 'eof',
  outfile: 'assets/app.js',
  define: { 'process.env.NODE_ENV': '"production"' },
  metafile: true,
  logLevel: 'info'
});

const packages = new Set();
for (const filename of Object.keys(result.metafile.inputs)) {
  const pattern = /(?:^|\/)node_modules\/((?:@[^/]+\/)?[^/]+)/g;
  const modules = [...filename.matchAll(pattern)];
  const source = modules.at(-1);
  if (source) packages.add(filename.slice(0, source.index + source[0].length));
}

const notices = ['html-excel v0.4 · Bundled third-party notices and licenses\n'];
for (const root of [...packages].sort()) {
  const metadata = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const files = (await readdir(root)).filter((file) => /^(?:LICENSE|LICENCE|NOTICE|COPYING)(?:[.\-_]|$)/i.test(file));
  notices.push(metadata.name + ' ' + metadata.version + ' · ' + (metadata.license ?? 'See upstream'));
  for (const file of files.sort()) {
    notices.push(file + '\n' + (await readFile(join(root, file), 'utf8')).trim());
  }
}
await writeFile('assets/THIRD-PARTY.txt', notices.join('\n\n') + '\n');
