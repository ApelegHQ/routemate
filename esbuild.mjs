#!/usr/bin/env node

/* Copyright © 2021 Exact Realty Limited.
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

import esbuild from 'esbuild';
import nodePath from 'node:path';

const buildOptionsBase = {
	entryPoints: ['./src/index.ts'],
	outdir: 'dist',
	bundle: true,
	minify: true,
	entryNames: '[name]',
	platform: 'node',
	external: ['firebase-functions'],
};

const formats = ['cjs', 'esm'];

const filterListeners = (includeListeners, excludeListeners) => ({
	name: 'filterListeners',
	setup(build) {
		build.onLoad(
			{
				filter: /./,
				namespace: 'filterListeners',
			},
			() => ({
				contents:
					'const x = () => {throw Error("Unsupported listener in this build")}; export default x;',
				loader: 'js',
			}),
		);

		build.onResolve(
			{
				filter: /./,
				namespace: 'file',
			},
			({ path, resolveDir }) => {
				const resolvedPath = nodePath.resolve(resolveDir, path);

				if (!/\/src\/listeners\/[^/]+$/.test(resolvedPath)) return;

				const baseName = nodePath.basename(path);

				if (
					(!excludeListeners ||
						!excludeListeners.includes(baseName)) &&
					(!includeListeners || includeListeners.includes(baseName))
				) {
					return;
				}

				return {
					external: false,
					namespace: 'filterListeners',
					path: path,
				};
			},
		);
	},
});

await Promise.resolve(
	formats.map((format) => {
		return esbuild.build({
			...buildOptionsBase,
			format,
			outExtension: {
				'.js': format === 'esm' ? '.mjs' : '.js',
			},
			plugins: [
				filterListeners(undefined, ['deno', 'cloudflare-workers']),
			],
		});
	}),
);

await Promise.resolve(
	formats.map((format) => {
		return esbuild.build({
			...buildOptionsBase,
			format,
			entryNames: 'cloudflare-workers',
			outExtension: {
				'.js': format === 'esm' ? '.mjs' : '.js',
			},
			plugins: [filterListeners(['cloudflare-workers', 'dynamic'])],
		});
	}),
);

esbuild.build({
	...buildOptionsBase,
	entryNames: 'deno',
	format: 'esm',
	outExtension: {
		'.js': '.mjs',
	},
	plugins: [filterListeners(['deno', 'dynamic'])],
});
