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

import { TErrorHandler } from '../types/index.js';
import errorResponseText from './errorResponseText.json' with { type: 'json' };

class ResponseError_ extends Error {
	cause?: Error | undefined;
	statusCode: number;

	constructor(statusCode: number, message?: string, cause?: Error);
	constructor(statusCode: number, cause?: Error);

	constructor(statusCode: number, message?: string | Error, cause?: Error) {
		super(typeof message === 'string' ? message : undefined);
		this.cause =
			typeof cause !== 'undefined'
				? cause
				: typeof message !== 'undefined' && typeof message !== 'string'
					? message
					: undefined;
		this.name = 'ResponseError';
		this.statusCode = statusCode;
	}
}

const errorHeaders = {
	['content-security-policy']:
		'default-src "none"; frame-ancestors "none"; upgrade-insecure-requests',
	['content-transfer-encoding']: '7bit',
	['content-type']: 'text/html; charset=US-ASCII',
	['referrer-policy']: 'no-referrer',
	['x-content-type-options']: 'nosniff',
	['x-frame-options']: 'DENY',
	['x-xss-protection']: '1; mode=block',
};

const errorHandler_: TErrorHandler = (error) => {
	const statusCode =
		typeof error === 'number'
			? error
			: error instanceof ResponseError_
				? error.statusCode
				: 500;

	return new Response(
		Object.prototype.hasOwnProperty.call(
			errorResponseText,
			String(statusCode),
		)
			? errorResponseText[
					String(statusCode) as keyof typeof errorResponseText
				]
			: null,
		{
			['status']: statusCode,
			['headers']: errorHeaders,
		},
	);
};

export default ResponseError_;
export { errorHandler_ as handleResponseError };
