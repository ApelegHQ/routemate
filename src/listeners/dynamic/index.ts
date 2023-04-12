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
/// <reference types="deno-types" />

const dynamic_ = async () => {
	if (typeof process !== 'undefined' && process.release?.name === 'node') {
		if (
			process.env?.['FUNCTION_TARGET'] &&
			process.env?.['FUNCTION_SIGNATURE_TYPE'] === 'http' &&
			process.env?.['K_SERVICE'] &&
			process.env?.['K_REVISION'] &&
			process.env?.['PORT']
		) {
			return import('../gcp-cloudfunction');
		}

		if (
			process.env?.['_HANDLER'] &&
			process.env?.['_X_AMZN_TRACE_ID'] &&
			process.env?.['AWS_LAMBDA_FUNCTION_NAME'] &&
			process.env?.['AWS_LAMBDA_FUNCTION_VERSION'] &&
			process.env?.['LAMBDA_TASK_ROOT']
		) {
			return import('../aws-lambda');
		}

		if (
			['Development', 'Staging', 'Production'].includes(
				process.env?.['AZURE_FUNCTIONS_ENVIRONMENT'] ?? '',
			)
		) {
			return import('../azure-functions');
		}

		return import('../node');
	} else if (
		typeof caches !== 'undefined' &&
		typeof WebSocketPair !== 'undefined'
	) {
		return import('../cloudflare-workers');
	} else if (typeof Deno !== 'undefined') {
		return import('../deno');
	} else {
		throw new Error('Unsupported environment');
	}
};

export default dynamic_;
