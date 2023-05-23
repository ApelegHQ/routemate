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

/// <reference types="deno-types" />

import type { TListener } from '../../types/index.js';

const createServer_: TListener =
	(r) =>
	async (
		arg1?: number | string | AbortSignal,
		arg2?: string | AbortSignal,
		arg3?: AbortSignal,
	) => {
		const port = typeof arg1 === 'number' ? arg1 : undefined;
		const host =
			typeof arg2 === 'string'
				? arg2
				: typeof arg1 === 'string'
				? arg1
				: undefined;
		const signal =
			arg3 instanceof AbortSignal
				? arg3
				: arg2 instanceof AbortSignal
				? arg2
				: arg1 instanceof AbortSignal
				? arg1
				: undefined;

		if (!port) {
			throw new RangeError('Invalid port');
		}

		const opts = { port: port, hostname: host };

		const server = Deno.listen(opts);

		if (signal) {
			signal.addEventListener('abort', () => server.close());
		}

		const serveHttp = async (conn: Deno.Conn) => {
			const httpConn = Deno.serveHttp(conn);
			for await (const requestEvent of httpConn) {
				try {
					requestEvent.respondWith(r(requestEvent.request));
				} catch (e) {
					console.log(`Error: ${e instanceof Error ? e.message : e}`);
					try {
						return requestEvent.respondWith(
							new Response(null, {
								status: 500,
							}),
						);
					} catch (se) {
						console.log(
							`Error in error handler: ${
								se instanceof Error ? se.message : se
							}`,
						);
					}
				}
			}
		};

		(async () => {
			for await (const conn of server) {
				serveHttp(conn).catch(Boolean);
			}
		})();

		return r;
	};

export default createServer_;
