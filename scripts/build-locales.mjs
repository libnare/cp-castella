/*
 * SPDX-FileCopyrightText: syuilo and other misskey, cherrypick contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs/promises';
import locales from '../locales/index.js';
import generateDTS from '../locales/generateDTS.js';
import meta from '../package.json' assert { type: "json" };

async function copyFrontendLocales() {
  generateDTS();

  await fs.mkdir('./built/_frontend_dist_/locales', { recursive: true });

  const v = { '_version_': meta.version };

  for (const [lang, locale] of Object.entries(locales)) {
    await fs.writeFile(`./built/_frontend_dist_/locales/${lang}.${meta.version}.json`, JSON.stringify({ ...locale, ...v }), 'utf-8');
  }
}

async function build() {
  await Promise.all([
    copyFrontendLocales(),
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
