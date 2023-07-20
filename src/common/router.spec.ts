/* Copyright © 2023 Exact Realty Limited. All rights reserved.
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
import Router from './router.js';

describe('Router', () => {
	it('No handler results in 501', async () => {
		const r = Router();

		const response = await r(new Request('urn:example'));

		assert.equal(response.status, 501);
	});

	it('Paths with handler respond correct status code', async () => {
		const r = Router();

		r.get('example/foo', () => 200);
		r.post('example/foo', () => 201);
		r.put('example/foo', () => null);
		r.patch('example/foo', () => undefined);
		r.route(['TEST'], 'example/foo', () => 404);
		r.use(/^example\/bar$/, () => new Response(null, { status: 599 }));

		const responses = await Promise.all([
			r(new Request('urn:example/foo')),
			r(new Request('urn:example/foo', { method: 'POST' })),
			r(new Request('urn:example/foo', { method: 'PUT' })),
			r(new Request('urn:example/foo', { method: 'PATCH' })),
			r(new Request('urn:example/foo', { method: 'TEST' })),
			r(new Request('urn:example/foo', { method: 'XXX' })),
			r(new Request('urn:example/bar')),
			r(new Request('urn:example/bar', { method: 'XXX' })),
			r(new Request('urn:example/baz')),
		]);

		assert.deepEqual(
			responses.map((r) => r.status),
			[200, 201, 204, 501, 404, 501, 599, 599, 501],
		);
	});

	it('Handler gets called for the configured method only', async () => {
		const r = Router();

		r.get(() => 200);
		r.get('example/foo', () => 201);
		r.get('example/bar', () => 400);
		r.get('example/bar', () => 202);
		r.get(/^example\/baz$/, () => 203);

		const responses = await Promise.all([
			r(new Request('urn:example/')),
			r(new Request('urn:example/foo')),
			r(new Request('urn:example/bar')),
			r(new Request('urn:example/baz')),
			r(new Request('urn:example/foo', { method: 'POST' })),
		]);

		assert.deepEqual(
			responses.map((r) => r.status),
			[200, 201, 202, 203, 501],
		);
	});

	it('Middleware takes precedence', async () => {
		const r = Router();

		r.get(() => 999);
		r.get('example/foo', () => 201);
		r.get('example/bar', () => 400);
		r.get('example/bar', () => 202);
		r.get(/^example\/baz$/, () => 203);
		r.use(() => 299);

		const responses = await Promise.all([
			r(new Request('urn:example/')),
			r(new Request('urn:example/foo')),
			r(new Request('urn:example/bar')),
			r(new Request('urn:example/baz')),
			r(new Request('urn:example/foo', { method: 'POST' })),
		]);

		assert.deepEqual(
			responses.map((r) => r.status),
			[299, 299, 299, 299, 299],
		);
	});

	it('Nested routers get used', async () => {
		const r = Router();
		const child = Router();
		const grandchild = Router();

		r.get(() => 200);
		r.get(/^example\//, child);
		child.get('example/bar', () => 201);
		child.get('example/baz', grandchild);
		grandchild.route(undefined, undefined, () => 202);

		const responses = await Promise.all([
			r(new Request('urn:example/')),
			r(new Request('urn:example/foo')),
			r(new Request('urn:example/bar')),
			r(new Request('urn:example/baz')),
			r(new Request('urn:example/foo', { method: 'POST' })),
		]);

		assert.deepEqual(
			responses.map((r) => r.status),
			[501, 501, 201, 202, 501],
		);
	});

	it('Different routers respond as configured', async () => {
		const r1 = Router();
		const r2 = Router();
		const r3 = Router();
		const r4 = Router();

		r1.route('example/bar', () => 444);
		r2.route(() => 403);

		r3.use('example/bar', () => 432);
		r4.use(() => new Response(null, { status: 234 }));

		const responses = await Promise.all(
			[r1, r2, r3, r4].flatMap((r) => [
				r(new Request('urn:example/bar')),
				r(new Request('urn:example/bar', { method: 'PUT' })),
				r(new Request('urn:example/foo')),
			]),
		);

		assert.deepEqual(
			responses.map((r) => r.status),
			[444, 444, 501, 403, 403, 403, 432, 432, 501, 234, 234, 234],
		);
	});

	it('Routers can handle different response formats', async () => {
		const r = Router(true);

		r.use(() => 222);
		r.get('example/foo', () => {
			throw 201;
		});
		r.get('example/bar', () => {
			throw new Response(null, { status: 202 });
		});
		r.get('example/baz', () => {
			throw new Error();
		});
		r.use(() => 200);

		const responses = await Promise.all([
			r(new Request('urn:example/')),
			r(new Request('urn:example/foo')), //
			r(new Request('urn:example/bar')), //
			r(new Request('urn:example/baz')), //
			r(new Request('urn:example/foo', { method: 'POST' })),
			r(new Request('urn:example/bar', { method: 'POST' })),
		]);

		assert.deepEqual(
			responses.map((r) => r.status),
			[200, 201, 202, 500, 200, 200],
		);
	});
});
