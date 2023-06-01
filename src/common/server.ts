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

import Router from './router.js';
import type { TListener, TServer } from './types/index.js';

const server_ = (listener: TListener): TServer => {
	const router = Router();

	const proxy: TServer = new Proxy<TServer>(router as unknown as TServer, {
		get(target, p) {
			if (p === 'listen') {
				return listener(router);
			}

			if (
				(['then', 'catch', 'finally'] as (string | symbol)[]).includes(
					p,
				)
			) {
				return undefined;
			}

			return (...args: unknown[]) => {
				const reflectedProperty = Reflect.get(target, p);

				if (reflectedProperty === router) {
					return proxy;
				} else if (typeof reflectedProperty === 'function') {
					const result = reflectedProperty(...args);

					if (result === router) {
						return proxy;
					} else {
						return result;
					}
				}

				return reflectedProperty;
			};
		},
	});

	return proxy;
};

export default server_;
export { Router };
