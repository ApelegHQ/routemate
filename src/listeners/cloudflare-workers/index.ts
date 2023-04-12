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

/// <reference types="@cloudflare/workers-types" />

import type { TListener } from '../../types';

const createServer_: TListener =
	(r) =>
	async (
		arg1?: number | string | AbortSignal,
		arg2?: string | AbortSignal,
		arg3?: AbortSignal,
	) => {
		const signal =
			arg3 instanceof AbortSignal
				? arg3
				: arg2 instanceof AbortSignal
				? arg2
				: arg1 instanceof AbortSignal
				? arg1
				: undefined;

		addEventListener('fetch', (event: FetchEvent) => {
			const response = r(event.request as unknown as Request).catch(
				(e) => {
					// log error;
					void e;
					return new Response(null, {
						status: 500,
					});
				},
			);

			try {
				event.respondWith(response);
			} catch (e) {
				void e;
				// log error
			}
		});

		if (signal) {
			signal.addEventListener('abort', () => {
				throw new Error('Abort operation not supported');
			});
		}

		return r;
	};

export default createServer_;
