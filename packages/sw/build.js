// @ts-check

/*
 * SPDX-FileCopyrightText: syuilo and other misskey, cherrypick contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import locales from '../../locales/index.js';
import meta from '../../package.json' assert { type: "json" };
import built_meta from '../../built/meta.json' assert { type: "json" };
const watch = process.argv[2]?.includes('watch');

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const CLIENT_ASSETS_BASE_URL = process.env.CLIENT_ASSETS_BASE_URL;
const CLIENT_ASSETS_DIR = process.env.CLIENT_ASSETS_DIR;
const clientAssetsBaseUrl = CLIENT_ASSETS_BASE_URL && CLIENT_ASSETS_DIR ? `${CLIENT_ASSETS_BASE_URL}/${CLIENT_ASSETS_DIR}` : "";

console.log('Starting SW building...');

/** @type {esbuild.BuildOptions} */
const buildOptions = {
	absWorkingDir: __dirname,
	bundle: true,
	define: {
		_DEV_: JSON.stringify(process.env.NODE_ENV !== 'production'),
		_ENV_: JSON.stringify(process.env.NODE_ENV ?? ''), // `NODE_ENV`が`undefined`なとき`JSON.stringify`が`undefined`を返してエラーになってしまうので`??`を使っている
		_LANGS_: JSON.stringify(Object.entries(locales).map(([k, v]) => [k, v._lang_])),
		_PERF_PREFIX_: JSON.stringify('CherryPick:'),
		_VERSION_: JSON.stringify(meta.version),
		_BASEDMISSKEYVERSION_: JSON.stringify(meta.basedMisskeyVersion),
		_COMMIT_: JSON.stringify(built_meta.commit),
		_SOURCE_CODE_: JSON.stringify(built_meta.sourceCode),
		_CLIENT_ASSETS_BASE_URL_: JSON.stringify(clientAssetsBaseUrl),
	},
	entryPoints: [`${__dirname}/src/sw.ts`],
	format: 'esm',
	loader: {
		'.ts': 'ts',
	},
	minify: process.env.NODE_ENV === 'production',
	outbase: `${__dirname}/src`,
	outdir: `${__dirname}/../../built/_sw_dist_`,
	treeShaking: true,
	tsconfig: `${__dirname}/tsconfig.json`,
};

(async () => {
	if (!watch) {
		await esbuild.build(buildOptions);
		console.log('done');
	} else {
		const context = await esbuild.context(buildOptions);
		await context.watch();
		console.log('watching...');
	}
})();
