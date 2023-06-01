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

import type {
	TErrorHandler,
	TMaybePromised,
	TPHandlerFullSetup,
	TPHandlerFullSetupH,
	TPHandlerFullSetupMPH,
	TPHandlerFullSetupPH,
	TPHandlerSetup,
	TPHandlerSetupH,
	TPHandlerSetupPH,
	TRequestHandler,
	TRequestMethod,
	TResponse,
	TRoute,
	TRouter,
} from './types/index.js';

const isTPHandlerFullSetupMPH = <T>(
	args: unknown[],
): args is Parameters<TPHandlerFullSetupMPH<T>> =>
	args.length === 3 && typeof args[2] === 'function';
const isTPHandlerFullSetupPH = <T>(
	args: unknown[],
): args is Parameters<TPHandlerFullSetupPH<T>> =>
	args.length === 2 && typeof args[1] === 'function';
const isTPHandlerFullSetupH = <T>(
	args: unknown[],
): args is Parameters<TPHandlerFullSetupH<T>> =>
	args.length === 1 && typeof args[0] === 'function';
const isTPHandlerSetupPH = <T>(
	args: unknown[],
): args is Parameters<TPHandlerSetupPH<T>> =>
	args.length === 2 && typeof args[1] === 'function';
const isTPHandlerSetupH = <T>(
	args: unknown[],
): args is Parameters<TPHandlerSetupH<T>> =>
	args.length === 1 && typeof args[0] === 'function';

const router_ = (handleUnhandledErrors = true) => {
	const requestHandlers: TRoute<TRequestHandler>[] = [];
	const errorHandlers: TRoute<TErrorHandler>[] = [];

	const route = async (request: Request) => {
		const url = new URL(request.url);

		const pipeline = requestHandlers
			.filter(
				([method]) =>
					method == undefined ||
					method === request.method ||
					(method as string[]).includes(request.method),
			)
			.filter(
				([, path]) =>
					path === undefined ||
					(path instanceof RegExp
						? path.test(url.pathname)
						: path === url.pathname),
			)
			.map(([, , h]) => h);

		const result = Promise.resolve(
			pipeline.reduce<TMaybePromised<TResponse>>(
				async (acc, cv) => cv(request, await acc, url),
				undefined,
			),
		)
			.then((response) => {
				if (response === undefined) {
					return new Response(null, { ['status']: 501 });
				}

				if (response === null) {
					return new Response(null, { ['status']: 204 });
				}

				if (typeof response === 'number') {
					return new Response(null, { ['status']: response });
				}

				return response;
			})
			.catch(async (e) => {
				const pipeline = errorHandlers
					.filter(
						([method]) =>
							method == undefined ||
							method === request.method ||
							(method as string[]).includes(request.method),
					)
					.filter(
						([, path]) =>
							path === undefined ||
							(path instanceof RegExp
								? path.test(url.pathname)
								: path === url.pathname),
					)
					.map(([, , h]) => h);

				if (pipeline.length === 0) {
					throw e;
				}

				const response = await pipeline.reduce<
					TMaybePromised<TResponse>
				>(async (acc, cv) => cv(e, request, await acc, url), undefined);

				if (response instanceof Response) {
					return response;
				}

				if (response === null) {
					return new Response(null, { ['status']: 204 });
				}

				if (typeof response === 'number') {
					return new Response(null, { ['status']: response });
				}

				throw e;
			});

		return !handleUnhandledErrors
			? result
			: result.catch((e) => {
					if (typeof e === 'number') {
						return new Response(null, { ['status']: e });
					} else if (e instanceof Response) {
						return e;
					}

					return new Response(null, { ['status']: 500 });
			  });
	};

	return (() => {
		const getter = (
			_target: never,
			prop: string | symbol,
		):
			| TPHandlerFullSetup<TRequestHandler>
			| TPHandlerFullSetup<TErrorHandler>
			| TPHandlerSetup<TRequestHandler>
			| TPHandlerSetup<TErrorHandler>
			| undefined => {
			if (typeof prop !== 'string') {
				throw new TypeError('Invalid prop type');
			}

			if (['then', 'catch', 'finally'].includes(prop)) {
				return undefined;
			}

			if (prop === 'route') {
				return ((...args: unknown[]) => {
					if (isTPHandlerFullSetupMPH<TRequestHandler>(args)) {
						requestHandlers.push(args);
					} else if (isTPHandlerFullSetupPH<TRequestHandler>(args)) {
						requestHandlers.push([undefined, args[0], args[1]]);
					} else if (isTPHandlerFullSetupH<TRequestHandler>(args)) {
						requestHandlers.push([undefined, undefined, args[0]]);
					} else {
						throw new Error('Invalid call signature');
					}

					return proxy;
				}) as TPHandlerFullSetup<TRequestHandler>;
			}

			if (prop === 'route:error') {
				return ((...args: unknown[]) => {
					if (isTPHandlerFullSetupMPH<TErrorHandler>(args)) {
						errorHandlers.push(args);
					} else if (isTPHandlerFullSetupPH<TErrorHandler>(args)) {
						errorHandlers.push([undefined, args[0], args[1]]);
					} else if (isTPHandlerFullSetupH<TErrorHandler>(args)) {
						errorHandlers.push([undefined, undefined, args[0]]);
					} else {
						throw new Error('Invalid call signature');
					}

					return proxy;
				}) as TPHandlerFullSetup<TErrorHandler>;
			}

			if (prop === 'use') {
				return ((...args: unknown[]) => {
					if (isTPHandlerSetupPH<TRequestHandler>(args)) {
						requestHandlers.push([undefined, args[0], args[1]]);
					} else if (isTPHandlerSetupH<TRequestHandler>(args)) {
						requestHandlers.push([undefined, undefined, args[0]]);
					} else {
						throw new Error('Invalid call signature');
					}

					return proxy;
				}) as TPHandlerSetup<TErrorHandler>;
			}

			if (prop === 'use:error') {
				return ((...args: unknown[]) => {
					if (isTPHandlerSetupPH<TErrorHandler>(args)) {
						errorHandlers.push([undefined, args[0], args[1]]);
					} else if (isTPHandlerSetupH<TErrorHandler>(args)) {
						errorHandlers.push([undefined, undefined, args[0]]);
					} else {
						throw new Error('Invalid call signature');
					}

					return proxy;
				}) as TPHandlerSetup<TRequestHandler>;
			}

			if (
				![
					'GET',
					'PUT',
					'POST',
					'DELETE',
					'HEAD',
					'OPTIONS',
					'PATCH',
					'PROPFIND',
					'PROPPATCH',
					'MKCOL',
					'COPY',
					'MOVE',
					'LOCK',
					'SEARCH',
				].includes(prop.toUpperCase())
			) {
				throw new TypeError(
					`Invalid HTTP verb '${prop.toUpperCase()}'. For custom verbs, use \`.route\` instead.`,
				);
			}

			return ((...args: unknown[]) => {
				const method = prop.toUpperCase() as TRequestMethod;

				if (isTPHandlerSetupPH<TRequestHandler>(args)) {
					requestHandlers.push([method, args[0], args[1]]);
				} else if (isTPHandlerSetupH<TRequestHandler>(args)) {
					requestHandlers.push([method, undefined, args[0]]);
				} else {
					throw new Error('Invalid call signature');
				}

				return proxy;
			}) as TPHandlerSetup<TRequestHandler>;
		};

		const proxy = new Proxy(route, {
			get: getter,
		});

		return proxy;
	})() as TRouter;
};

export default router_;
