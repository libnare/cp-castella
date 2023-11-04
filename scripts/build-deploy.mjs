/*
 * SPDX-FileCopyrightText: syuilo and other misskey, cherrypick contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs/promises';
import locales from '../locales/index.js';
import generateDTS from '../locales/generateDTS.js';
import meta from '../package.json' assert { type: "json" };
import built_meta from '../built/meta.json' assert { type: "json" };

async function copyFrontendLocales() {
  generateDTS();

  await fs.mkdir('./built/_frontend_dist_/locales', { recursive: true });

  const v = { '_version_': meta.version };

  for (const [lang, locale] of Object.entries(locales)) {
    await fs.writeFile(`./built/_frontend_dist_/locales/${lang}.${built_meta.version}.json`, JSON.stringify({ ...locale, ...v }), 'utf-8');
  }
}

async function copyFrontendShikiAssets() {
  await fs.cp('./packages/frontend/node_modules/shiki/dist', './built/_frontend_dist_/shiki/dist', { dereference: true, recursive: true });
  await fs.cp('./packages/frontend/node_modules/shiki/languages', './built/_frontend_dist_/shiki/languages', { dereference: true, recursive: true });
  await fs.cp('./packages/frontend/node_modules/aiscript-vscode/aiscript/syntaxes', './built/_frontend_dist_/shiki/languages', { dereference: true, recursive: true });
  await fs.cp('./packages/frontend/node_modules/shiki/themes', './built/_frontend_dist_/shiki/themes', { dereference: true, recursive: true });
}

async function build() {
  await Promise.all([
    copyFrontendLocales(),
    copyFrontendShikiAssets(),
  ]);
}

await build();

if (process.argv.includes("--watch")) {
  const watcher = fs.watch('./packages', { recursive: true });
  for await (const event of watcher) {
    if (/^[a-z]+\/src/.test(event.filename)) {
      await build();
    }
  }
}
