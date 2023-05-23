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

import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import { TListen, TListener, TRouter } from '../../types/index.js';

const nodeHandler_ =
	(r: TRouter) => (req: IncomingMessage, res: ServerResponse) => {
		const incomingBodyStream = [undefined, 'GET', 'HEAD'].includes(
			req.method,
		)
			? null
			: new ReadableStream({
					['start'](controller) {
						req.on('data', (chunk) => {
							controller.enqueue(chunk);
						});

						req.on('end', () => {
							controller.close();
						});

						req.on('error', (e) => {
							controller.error(e);
						});
					},
			  });

		const stdReq = new Request(
			new URL(
				`http://${req.headers['host'] ?? 'default.local.'}${req.url}`,
			).toString(),
			{
				duplex: 'half',
				method: req.method,
				headers: new Headers(
					Array.from(
						{ length: req.rawHeaders.length / 2 },
						(_: never, i) =>
							req.rawHeaders.slice(i * 2, i * 2 + 2) as [
								string,
								string,
							],
					),
				),
				body: incomingBodyStream,
			},
		);

		r(stdReq)
			.then(async (stdRes) => {
				const headers: [string, string][] = [];
				stdRes.headers.forEach((v, k) => headers.push([k, v]));

				res.writeHead(stdRes.status, stdRes.statusText, headers);

				if (stdRes.body) {
					const chunks = (
						reader: ReadableStreamDefaultReader<Uint8Array>,
					) => ({
						async *[Symbol.asyncIterator]() {
							for (;;) {
								const r = await reader.read();
								if (r.done) break;
								yield r.value;
							}
						},
					});

					const reader = stdRes.body.getReader();
					try {
						for await (const chunk of chunks(reader)) {
							res.write(chunk);
						}
					} finally {
						reader.releaseLock();
					}
				}
			})
			.catch((e) => {
				console.log(`Error: ${e instanceof Error ? e.message : e}`);
				if (!res.headersSent) {
					res.writeHead(500);
				}
			})
			.finally(() => {
				res.end();
			})
			.catch((e) => {
				console.log(`Error: ${e instanceof Error ? e.message : e}`);
			});
	};

const createServer_: TListener = (r) => {
	const app = createServer(nodeHandler_(r));

	const listen: TListen = (
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

		return new Promise<TRouter>((resolve, reject) => {
			try {
				app.listen(port, host, () => resolve(r));

				if (signal) {
					signal.addEventListener('abort', () => app.close());
				}
			} catch (e) {
				reject(e);
			}
		});
	};

	return listen;
};

export default createServer_;
export { nodeHandler_ };
