/* Copyright © 2023 Exact Realty Limited.
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

export type TMaybePromised<T> = Awaited<PromiseLike<T>> | PromiseLike<T>;

enum EHttpMethods {
	GET = 'get',
	PUT = 'put',
	POST = 'post',
	DELETE = 'delete',
	HEAD = 'head',
	OPTIONS = 'options',
	PATCH = 'patch',
	PROPFIND = 'propfind',
	PROPPATCH = 'proppatch',
	MKCOL = 'mkcol',
	COPY = 'copy',
	MOVE = 'move',
	LOCK = 'lock',
}

export type TRequestMethod = keyof { [k in EHttpMethods]: never };

type TRequestPath = undefined | string | RegExp;
export type TResponse = Response | number | null | undefined;
export type TRequestHandler = {
	(
		req: Readonly<Request>,
		res: TMaybePromised<Readonly<TResponse>>,
		url: URL,
	): TMaybePromised<Readonly<TResponse>>;
};
export type TErrorHandler = {
	(
		err: unknown,
		req: Readonly<Request>,
		res: TMaybePromised<Readonly<TResponse>>,
		url: URL,
	): TMaybePromised<Readonly<TResponse>>;
};
export type TRoute<TH> = [
	undefined | string | string[],
	undefined | TRequestPath | TRequestPath[],
	TH,
];
export type TRouter = {
	(r: Request): Promise<Response>;
	['route']: TPHandlerFullSetup<TRequestHandler>;
	['route:error']: TPHandlerFullSetup<TErrorHandler>;
	['use']: TPHandlerSetup<TRequestHandler>;
	['use:error']: TPHandlerSetup<TErrorHandler>;
} & {
	[k in EHttpMethods]: TPHandlerSetup<TRequestHandler>;
};
export type TPHandlerFullSetupMPH<TH> = {
	(methods: TRoute<TH>[0], path: TRequestPath, handler: TH): TRouter;
};
export type TPHandlerFullSetupPH<TH> = {
	(path: TRequestPath, handler: TH): TRouter;
};
export type TPHandlerFullSetupH<TH> = {
	(handler: TH): TRouter;
};
export type TPHandlerFullSetup<TH> = TPHandlerFullSetupMPH<TH> &
	TPHandlerFullSetupPH<TH> &
	TPHandlerFullSetupH<TH>;
export type TPHandlerSetupPH<TH> = {
	(path: TRequestPath, handler: TH): TRouter;
};
export type TPHandlerSetupH<TH> = {
	(handler: TH): TRouter;
};
export type TPHandlerSetup<TH> = TPHandlerSetupPH<TH> & TPHandlerSetupH<TH>;

export type TRouterMap = {
	[k: string | symbol]: TRouter;
};

export type TServer = TRouter & {
	listen: TListen;
};

export type TListen = {
	(port?: number, host?: string, signal?: AbortSignal): Promise<TRouter>;
} & {
	(port?: number, signal?: AbortSignal): Promise<TRouter>;
} & {
	(host?: string, signal?: AbortSignal): Promise<TRouter>;
} & {
	(signal?: AbortSignal): Promise<TRouter>;
};

export type TListener = {
	(r: TRouter): {
		(...args: Parameters<TListen>): Promise<TRouter>;
	};
};
