/* Copyright © 2023 Apeleg Limited. All rights reserved.
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

import assert from 'node:assert/strict';
import nodeListener from './index.js';
import server, { Router } from '../../common/server.js';
import { handleResponseError as handleResponseError } from '../../common/ResponseError/index.js';

const abortController = new AbortController();
const port = (Math.random() * (1 << 15)) | 0 | (1 << 11);
const host = '127.0.0.1';

const random = Math.random();

before(async () => {
	const textEncoder = new TextEncoder();
	const r = server(nodeListener);
	const sr = Router();

	sr.get(
		() =>
			new Response(
				textEncoder.encode('DEFAULT RESPONSE FROM sr:' + random),
			),
	).route('GET', '/route', () => new Response());

	r.use(sr)
		.get(
			'/',
			(_req, _res, url) =>
				new Response(Buffer.from(JSON.stringify({ ['url']: url })), {
					headers: {
						['content-type']: 'text/json',
					},
				}),
		)
		.get(
			'/hello',
			(_req, _res, url) =>
				new Response(
					textEncoder.encode(
						`Hello, ${url.search.slice(1) || '(undefined)'}!`,
					),
					{
						headers: {
							['content-type']: 'text/plain',
						},
					},
				),
		);

	r.use('/eh/406', () => {
		throw 406;
	});
	r.post('/post', async (req) => {
		return new Response('body: ' + (await req.text()));
	});
	r['use:error']('/eh/406', handleResponseError);

	await r.listen(port, host, abortController.signal);
});

after(abortController.abort.bind(abortController));

describe('Node.js handler', () => {
	it('Test 1: /${Math.random()}', async () => {
		await fetch(`http://${host}:${port}/${Math.random()}`).then(
			async (v) => {
				assert.equal(
					await v.text(),
					'DEFAULT RESPONSE FROM sr:' + random,
				);
			},
		);
	});

	it('Test 2: /route', async () => {
		await fetch(`http://${host}:${port}/route`).then(async (v) => {
			assert.equal(await v.text(), '');
		});
	});

	it('Test 3: /', async () => {
		await fetch(`http://${host}:${port}/`).then(async (v) => {
			assert.deepEqual(await v.json(), {
				['url']: `http://${host}:${port}/`,
			});
		});
	});

	it('Test 4: /hello', async () => {
		await fetch(`http://${host}:${port}/hello`).then(async (v) => {
			assert.equal(await v.text(), 'Hello, (undefined)!');
		});
	});

	it('Test 5: /hello?World', async () => {
		await fetch(`http://${host}:${port}/hello?World`).then(async (v) => {
			assert.equal(await v.text(), 'Hello, World!');
		});
	});

	it('Test 6: /hello', async () => {
		await fetch(`http://${host}:${port}/hello`).then(async (v) => {
			assert.equal(await v.text(), 'Hello, (undefined)!');
		});
	});

	it('Test 7: /eh/406', async () => {
		await fetch(`http://${host}:${port}/eh/406`).then(async (v) => {
			assert.equal(v.status, 406);
			assert.equal(
				(await v.text())
					.slice(0, '<!doctype html>'.length)
					.toLowerCase(),
				'<!doctype html>',
			);
		});
	});

	it('Test 8: /post', async () => {
		await fetch(`http://${host}:${port}/post`, {
			method: 'POST',
			body: 'hello, world!',
		}).then(async (v) => {
			assert.equal(v.status, 200);
			assert.equal(await v.text(), 'body: hello, world!');
		});
	});
});
