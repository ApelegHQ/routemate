# Routemate

Routemate is a JavaScript router with support for various environments such as Node.js, Deno and Cloudflare Workers, with more to come. It is configured similarly to Express.js but uses standard `Request`, `Response`, and `Headers` elements.

 [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=Exact-Realty_routemate&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=Exact-Realty_routemate)
 [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=Exact-Realty_routemate&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=Exact-Realty_routemate)
 [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=Exact-Realty_routemate&metric=bugs)](https://sonarcloud.io/summary/new_code?id=Exact-Realty_routemate)
 [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=Exact-Realty_routemate&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=Exact-Realty_routemate)
 [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=Exact-Realty_routemate&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=Exact-Realty_routemate)
 ![NPM Downloads](https://img.shields.io/npm/dw/@apeleghq/routemate?style=flat-square)

## Installation

You can install Routemate via npm or yarn:

```sh
npm install "@apeleghq/routemate"
```

```sh
yarn add "@apeleghq/routemate"
```

## Getting Started

Here's an example of setting up Routemate for Node.js:

```js
import server, { listeners } from '@apeleghq/routemate';
import nodeListener from './node';
// Optional error handler
import { handleResponseError } from 'routemate/dist/ResponseError';

// Set up router with Node.js bindings
const router = server(listeners.node);
const port = 3000;
const host = 'localhost';

router.get('/', (_req, res) => {
  const responseBody = 'Hello, World';
  const headers = { 'content-type': 'text/plain' };
  return new Response(responseBody, { headers });
});

router['use:error'](handleResponseError);
```

## API

### `Router`

`Router` is the base router method. It provides several methods to set up routing like `.use` and`.route` (`['use:error']` and `['route:error']` can be used for setting up error handlers). It also provides convenience methods for the standard HTTP methods, like `.get`, `.head`, `.post`, etc.

```js
import { Router } from '@apeleghq/routemate';

const r = Router();

// Request handlers receive three arguments:
// * req: A Request object with the original request
// * res: The latest response in the pipeline.
//        This can be a Response object, `undefined`
//        for first handler in the pipeline, or it
//        can be what the last handler returned.
// * url: A URL object with the request URL for convenience
// Handlers should return a THandlerResponse, defined as follows:
// type TResponse = Response | number | null | undefined;
// Handlers may throw a Response object or a number.
// This has the effect of returning said response, skipping
// the remaining handlers in the pipeline.

// Error handlers are also evaluated in a pipeline and receive
// four arguments
// * err: The value thrown in a request handler
// * req: As for request handlers
// * res: As for request handlers
// * url: As for request handlers

// Handlers can return a number for an empty response with that
// status code
r.get('example/foo', () => 200);
// Handlers can be async
r.post('example/foo', () => Promise.resolve(201));
// A null response is an empty 204 No Content response
r.put('example/foo', () => null);
// An undefined response corresponds to 501 Not Implemented
r.patch('example/foo', () => undefined);
// .route allows for custom HTTP methods. Methods can be a string
// or an array
r.route(['TEST'], 'example/foo', () => 404);
// Paths can be regular expressions
r.use(/^example\/bar$/, () => new Response(null, { status: 599 }));

// Multiple handlers for the same path.
// They are evaluated *in order*, but the last one is the final
// response. Handlers receive the previous response as their second
// argument, so this can be helpful for setting up pipelines
r.get('example/qux', () => 400);
r.get('example/qux', () => 202);

// Routers can be nested
const child = Router();
const grandchild = Router();

child.get('example/bar', () => 201);
child.get('example/baz', grandchild);
grandchild.route(undefined, undefined, () => 202);
```


### `server`

The main entry point for Routemate is the `server`. A `server` is similar to a `Router`, except that it also provides a `listen` method. The `listen` method is used to accept connections.

The `.listen` method returns a `Promise` that evaluates to a `Router` when successful. It takes three optional arguments, a port number, a hostname and an `AbortSignal` instance. Not all listeners support all arguments. Some listeners may require certain arguments (like a port number) to be given.

```js
import server, { listeners } from '@apeleghq/routemate';

const app = server(listeners.node);

// Optional arguments
const port = 3000;
const host = 'www.example.com';
const abortController = new AbortController();

app.get('/', () => 200);

const router = await app.listen(port, host, abortController.signal);

// Continue configuration
router.get('/route', () => 200);

// Shut down the server after one second
setTimeout(() => abortController.abort(), 1000);
```

## Roadmap

  * Add support for more environments

## Contributing

Contributions are welcome! If you have any ideas for improving this router, please open an issue or submit a pull request.

## License

This router is licensed under the ISC License. See the `LICENSE` file for details.
