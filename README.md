<!-- markdownlint-disable-next-line MD041 MD033 -- 033: necessary for setting the width; 041: this is the style of bufbuild READMEs -->
<img src="assets/connect-query@16x.png" width="15%" />

<!-- omit in toc -->

# Connect-Query

[![License](https://img.shields.io/github/license/connectrpc/connect-query-es?color=blue)](./LICENSE) [![Build](https://github.com/connectrpc/connect-query-es/actions/workflows/ci.yaml/badge.svg?branch=main)](https://github.com/connectrpc/connect-query-es/actions/workflows/ci.yaml) [![NPM Version](https://img.shields.io/npm/v/@connectrpc/connect-query/latest?color=green&label=%40connectrpc%2Fconnect-query)](https://www.npmjs.com/package/@connectrpc/connect-query) [![NPM Version](https://img.shields.io/npm/v/@connectrpc/protoc-gen-connect-query/latest?color=green&label=%40connectrpc%2Fprotoc-gen-connect-query)](https://www.npmjs.com/package/@connectrpc/protoc-gen-connect-query)

Connect-Query is an wrapper around [TanStack Query](https://tanstack.com/query) (react-query), written in TypeScript and thoroughly tested. It enables effortless communication with servers that speak the [Connect Protocol](https://connectrpc.com/docs/protocol).

- [Quickstart](#quickstart)
  - [Install](#install)
  - [Usage](#usage)
  - [Generated Code](#generated-code)
- [Connect-Query API](#connect-query-api)
  - [`MethodUnaryDescriptor`](#methodunarydescriptor)
  - [`TransportProvider`](#transportprovider)
  - [`useTransport`](#usetransport)
  - [`useQuery`](#usequery)
  - [`useSuspenseQuery`](#usesuspensequery)
  - [`useInfiniteQuery`](#useinfinitequery)
  - [`useSuspenseInfiniteQuery`](#usesuspenseinfinitequery)
  - [`useMutation`](#usemutation)
  - [`createConnectQueryKey`](#createconnectquerykey)
  - [`callUnaryMethod`](#callunarymethod)
  - [`createProtobufSafeUpdater`](#createprotobufsafeupdater)
  - [`createQueryOptions`](#createqueryoptions)
  - [`createInfiniteQueryOptions`](#createinfinitequeryoptions)
  - [`addStaticKeyToTransport`](#addstatickeytotransport)
  - [`ConnectQueryKey`](#connectquerykey)

## Quickstart

### Install

```sh
npm install @connectrpc/connect-query @connectrpc/connect-web
```

Note: If you are using something that doesn't automatically install peerDependencies (npm older than v7), you'll want to make sure you also have `@bufbuild/protobuf`, `@connectrpc/connect`, and `@tanstack/react-query` installed. `@connectrpc/connect-web` is required for defining
the transport to be used by the client.

### Usage

Connect-Query will immediately feel familiar to you if you've used TanStack Query. It provides a similar API, but instead takes a definition for your endpoint and returns a typesafe API for that endpoint.

First, make sure you've configured your provider and query client:

```tsx
import { createConnectTransport } from "@connectrpc/connect-web";
import { TransportProvider } from "@connectrpc/connect-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const finalTransport = createConnectTransport({
  baseUrl: "https://demo.connectrpc.com",
});

const queryClient = new QueryClient();

function App() {
  return (
    <TransportProvider transport={finalTransport}>
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </TransportProvider>
  );
}
```

With configuration completed, you can now use the `useQuery` hook to make a request:

```ts
import { useQuery } from '@connectrpc/connect-query';
import { example } from 'your-generated-code/example-ExampleService_connectquery';

export const Example: FC = () => {
  const { data } = useQuery(example);
  return <div>{data}</div>;
};
```

**_That's it!_**

The [code generator](packages/protoc-gen-connect-query/README.md) does all the work of turning your Protobuf file into something you can easily import. TypeScript types all populate out-of-the-box. Your documentation is also converted to [TSDoc](https://tsdoc.org/).

One of the best features of this library is that once you write your schema in Protobuf form, the TypeScript types are generated and then inferred. You never again need to specify the types of your data since the library does it automatically.

### Generated Code

This example shows the best developer experience using code generation. Here's what that generated code looks like:

```ts title="your-generated-code/example-ExampleService_connectquery"
import { MethodKind } from "@bufbuild/protobuf";
import { ExampleRequest, ExampleResponse } from "./example_pb.js";

export const example = {
  name: "Example",
  kind: MethodKind.Unary,
  I: ExampleRequest,
  O: ExampleResponse,
  service: {
    typeName: "your.company.com.example.v1.ExampleService",
  },
};
```

The above code doesn't have to be generated and can be manually used to describe any given endpoint.

For more information on code generation, see the [documentation](./packages/protoc-gen-connect-query/README.md) for `protoc-gen-connect-query`.

## Connect-Query API

### `MethodUnaryDescriptor`

A type that describes a single unary method. It describes the following properties:

- `name`: The name of the method.
- `kind`: The kind of method. In this case, it's usually `MethodKind.Unary`.
- `I`: The input message type.
- `O`: The output message type.
- `service.typeName`: The fully qualified name of the service the method exists on.

This type is core to how connect-query can stay lightweight and
limit the amount of code actually generated. The descriptor is expected to be passed to almost all the methods in this library.

### `TransportProvider`

```ts
const TransportProvider: FC<
  PropsWithChildren<{
    transport: Transport;
  }>
>;
```

`TransportProvider` is the main mechanism by which Connect-Query keeps track of the `Transport` used by your application.

Broadly speaking, "transport" joins two concepts:

1. The protocol of communication. For this there are two options: the [Connect Protocol](https://connectrpc.com/docs/protocol/), or the [gRPC-Web Protocol](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md).
1. The protocol options. The primary important piece of information here is the `baseUrl`, but there are also other potentially critical options like request credentials, wire serialization options, or protocol-specific options like Connect's support for [HTTP GET](https://connectrpc.com/docs/web/get-requests-and-caching).

With these two pieces of information in hand, the transport provides the critical mechanism by which your app can make network requests.

To learn more about the two modes of transport, take a look at the Connect-Web documentation on [choosing a protocol](https://connectrpc.com/docs/web/choosing-a-protocol/).

To get started with Connect-Query, simply import a transport (either [`createConnectTransport`](https://github.com/connectrpc/connect-es/blob/main/packages/connect-web/src/connect-transport.ts) or [`createGrpcWebTransport`](https://github.com/connectrpc/connect-es/blob/main/packages/connect-web/src/grpc-web-transport.ts) from [`@connectrpc/connect-web`](https://www.npmjs.com/package/@connectrpc/connect-web)) and pass it to the provider.

A common use case for the transport is to add headers to requests (like auth tokens, etc). You can do this with a custom [interceptor](https://connectrpc.com/docs/web/interceptors).

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TransportProvider } from "@connectrpc/connect-query";

const queryClient = new QueryClient();

export const App = () => {
  const transport = createConnectTransport({
    baseUrl: "<your baseUrl here>",
    interceptors: [
      (next) => (request) => {
        request.header.append("some-new-header", "some-value");
        // Add your headers here
        return next(request);
      },
    ],
  });
  return (
    <TransportProvider transport={transport}>
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </TransportProvider>
  );
};
```

For more details about what you can do with the transport, see the [Connect-Web documentation](https://connectrpc.com/docs/web/).

### `useTransport`

```ts
const useTransport: () => Transport;
```

Use this helper to get the default transport that's currently attached to the React context for the calling component.

### `useQuery`

```ts
function useQuery<
  I extends DescMessage,
  O extends DescMessage,
  SelectOutData = MessageShape<O>,
>(
  schema: MethodUnaryDescriptor<I, O>,
  input?: SkipToken | MessageInitShape<I>,
  { transport, ...queryOptions }: UseQueryOptions<I, O, SelectOutData> = {},
): UseQueryResult<SelectOutData, ConnectError>;
```

The `useQuery` hook is the primary way to make a unary request. It's a wrapper around TanStack Query's [`useQuery`](https://tanstack.com/query/v5/docs/react/reference/useQuery) hook, but it's preconfigured with the correct `queryKey` and `queryFn` for the given method.

Any additional `options` you pass to `useQuery` will be merged with the options that Connect-Query provides to @tanstack/react-query. This means that you can pass any additional options that TanStack Query supports.

### `useSuspenseQuery`

Identical to useQuery but mapping to the `useSuspenseQuery` hook from [TanStack Query](https://tanstack.com/query/v5/docs/react/reference/useSuspenseQuery). This includes the benefits of narrowing the resulting data type (data will never be undefined).

### `useInfiniteQuery`

```ts
function useInfiniteQuery<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends keyof MessageInitShape<I>,
>(
  schema: MethodUnaryDescriptor<I, O>,
  input:
    | SkipToken
    | (MessageInitShape<I> & Required<Pick<MessageInitShape<I>, ParamKey>>),
  {
    transport,
    pageParamKey,
    getNextPageParam,
    ...queryOptions
  }: UseInfiniteQueryOptions<I, O, ParamKey>,
): UseInfiniteQueryResult<InfiniteData<MessageShape<O>>, ConnectError>;
```

The `useInfiniteQuery` is a wrapper around TanStack Query's [`useInfiniteQuery`](https://tanstack.com/query/v5/docs/react/reference/useInfiniteQuery) hook, but it's preconfigured with the correct `queryKey` and `queryFn` for the given method.

There are some required options for `useInfiniteQuery`, primarily `pageParamKey` and `getNextPageParam`. These are required because Connect-Query doesn't know how to paginate your data. You must provide a mapping from the output of the previous page and getting the next page. All other options passed to `useInfiniteQuery` will be merged with the options that Connect-Query provides to @tanstack/react-query. This means that you can pass any additional options that TanStack Query supports.

### `useSuspenseInfiniteQuery`

Identical to useInfiniteQuery but mapping to the `useSuspenseInfiniteQuery` hook from [TanStack Query](https://tanstack.com/query/v5/docs/react/reference/useSuspenseInfiniteQuery). This includes the benefits of narrowing the resulting data type (data will never be undefined).

### `useMutation`

```ts
function useMutation<I extends DescMessage, O extends DescMessage>(
  schema: MethodUnaryDescriptor<I, O>,
  { transport, ...queryOptions }: UseMutationOptions<I, O, Ctx> = {},
): UseMutationResult<MessageShape<O>, ConnectError, PartialMessage<I>>;
```

The `useMutation` is a wrapper around TanStack Query's [`useMutation`](https://tanstack.com/query/v5/docs/react/reference/useMutation) hook, but it's preconfigured with the correct `mutationFn` for the given method.

Any additional `options` you pass to `useMutation` will be merged with the options that Connect-Query provides to @tanstack/react-query. This means that you can pass any additional options that TanStack Query supports.

### `createConnectQueryKey`

```ts
function createConnectQueryKey<Desc extends DescMethod | DescService>(
  params: KeyParams<Desc>,
): ConnectQueryKey;
```

This function is used under the hood of `useQuery` and other hooks to compute a [`queryKey`](https://tanstack.com/query/v4/docs/react/guides/query-keys) for TanStack Query. You can use it to create (partial) keys yourself to filter queries.

`useQuery` creates a query key with the following parameters:
1. The qualified name of the RPC.
2. The transport being used.
3. The request message.

To create the same key manually, you simply provide the same parameters:


```ts
import { createConnectQueryKey, useTransport } from "@connectrpc/connect-query";
import { ElizaService } from "./gen/eliza_pb";

const myTransport = useTransport();
const queryKey = createConnectQueryKey({
  // The schema is the only required parameter. 
  schema: ElizaService.method.say,
  transport: myTransport,
  // You can provide a partial message here.
  input: { sentence: "hello" },
});

// queryKey:
[
  "conect-query",
  {
    transport: "t1",
    serviceName: "connectrpc.eliza.v1.ElizaService",
    methodName: "Say",
    input: { sentence: "hello" },
    cardinality: "finite",
  }
]
```

You can create a partial key that matches all RPCs of a service:

```ts
import { createConnectQueryKey } from "@connectrpc/connect-query";
import { ElizaService } from "./gen/eliza_pb";

const queryKey = createConnectQueryKey({
  schema: ElizaService,
});

// queryKey:
[
  "conect-query",
  {
    serviceName: "connectrpc.eliza.v1.ElizaService",
    cardinality: "finite",
  }
]
```

Infinite queries have distinct keys. To create a key for an infinite query, use the parameter `cardinality`:

```ts
import { createConnectQueryKey } from "@connectrpc/connect-query";
import { ListService } from "./gen/list_pb";

// The hook useInfiniteQuery() creates a query key with cardinality: "infinite",
// and passes on the pageParamKey.
const queryKey = createConnectQueryKey({
  schema: ListService.method.list,
  cardinality: "infinite", // "any" matches infinite and finite queries
  pageParamKey: "page",
  input: { preview: true },
});
```


### `callUnaryMethod`

```ts
function callUnaryMethod<I extends DescMessage, O extends DescMessage>(
  transport: Transport,
  schema: MethodUnaryDescriptor<I, O>,
  input: MessageInitShape<I> | undefined,
  options?: {
    signal?: AbortSignal;
  },
): Promise<O>;
```

This API allows you to directly call the method using the provided transport. Use this if you need to manually call a method outside of the context of a React component, or need to call it where you can't use hooks.

### `createProtobufSafeUpdater`

Creates a typesafe updater that can be used to update data in a query cache. Used in combination with a queryClient.

```ts
import { createProtobufSafeUpdater } from '@connectrpc/connect-query';
import { useQueryClient } from "@tanstack/react-query";

...
const queryClient = useQueryClient();
queryClient.setQueryData(
  createConnectQueryKey(example),
  createProtobufSafeUpdater(example, (prev) => {
    if (prev === undefined) {
      return undefined;
    }
    return {
      ...prev,
      completed: true,
    };
  })
);

```

### `createQueryOptions`

```ts
function createQueryOptions<I extends DescMessage, O extends DescMessage>(
  schema: MethodUnaryDescriptor<I, O>,
  input: SkipToken | PartialMessage<I> | undefined,
  {
    transport,
  }: {
    transport: Transport;
  },
): {
  queryKey: ConnectQueryKey<I>;
  queryFn: QueryFunction<MessageShape<O>, ConnectQueryKey<I>> | SkipToken;
  structuralSharing: Exclude<UseQueryOptions["structuralSharing"], undefined>;
};
```

A functional version of the options that can be passed to the `useQuery` hook from `@tanstack/react-query`. When called, it will return the appropriate `queryKey`, `queryFn`, and `structuralSharing` flag. This is useful when interacting with `useQueries` API or queryClient methods (like [ensureQueryData](https://tanstack.com/query/latest/docs/reference/QueryClient#queryclientensurequerydata), etc).

An example of how to use this function with `useQueries`:

```ts
import { useQueries } from "@tanstack/react-query";
import { createQueryOptions, useTransport } from "@connectrpc/connect-query";
import { example } from "your-generated-code/example-ExampleService_connectquery";

const MyComponent = () => {
  const transport = useTransport();
  const [query1, query2] = useQueries([
    createQueryOptions(example, { sentence: "First query" }, { transport }),
    createQueryOptions(example, { sentence: "Second query" }, { transport }),
  ]);
  ...
};
```

### `createInfiniteQueryOptions`

```ts
function createInfiniteQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends keyof MessageInitShape<I>,
>(
  schema: MethodUnaryDescriptor<I, O>,
  input:
    | SkipToken
    | (MessageInitShape<I> & Required<Pick<MessageInitShape<I>, ParamKey>>),
  {
    transport,
    getNextPageParam,
    pageParamKey,
  }: ConnectInfiniteQueryOptions<I, O, ParamKey>,
): {
  getNextPageParam: ConnectInfiniteQueryOptions<
    I,
    O,
    ParamKey
  >["getNextPageParam"];
  queryKey: ConnectInfiniteQueryKey<I>;
  queryFn:
    | QueryFunction<
        MessageShape<O>,
        ConnectInfiniteQueryKey<I>,
        MessageInitShape<I>[ParamKey]
      >
    | SkipToken;
  structuralSharing: Exclude<UseQueryOptions["structuralSharing"], undefined>;
  initialPageParam: PartialMessage<I>[ParamKey];
};
```

A functional version of the options that can be passed to the `useInfiniteQuery` hook from `@tanstack/react-query`.When called, it will return the appropriate `queryKey`, `queryFn`, and `structuralSharing` flags, as well as a few other parameters required for `useInfiniteQuery`. This is useful when interacting with some queryClient methods (like [ensureQueryData](https://tanstack.com/query/latest/docs/reference/QueryClient#queryclientensurequerydata), etc).

### `addStaticKeyToTransport`

Transports are taken into consideration when building query keys for associated queries. This can cause issues with SSR since the transport on the server is not the same transport that gets executed on the client (cannot be tracked by reference). To bypass this, you can use this method to add an explicit key to the transport that will be used in the query key.

### `ConnectQueryKey`

```ts
type ConnectQueryKey = [
  /**
   * To distinguish Connect query keys from other query keys, they always start with the string "connect-query".
   */
  "connect-query",
  {
    /**
     * A key for a Transport reference, created with createTransportKey().
     */
    transport?: string;
    /**
     * The name of the service, e.g. connectrpc.eliza.v1.ElizaService
     */
    serviceName: string;
    /**
     * The name of the method, e.g. Say.
     */
    methodName?: string;
    /**
     * A key for the request message, created with createMessageKey(),
     * or "skipped".
     */
    input?: Record<string, unknown> | "skipped";
    /**
     * Whether this is an infinite query, or a regular one.
     */
    cardinality?: "infinite" | "finite";
  },
];
```

TanStack Query manages query caching for you based on query keys. [`QueryKey`s](https://tanstack.com/query/v4/docs/react/guides/query-keys) in TanStack Query are arrays with arbitrary JSON-serializable data - typically handwritten for each endpoint. In Connect-Query, query keys are more structured, since queries are always tied to a service, RPC, input message, and transport. For example, a query key might look like this:

```ts
[
  "connect-query",
  {
    transport: "t1",
    serviceName: "connectrpc.eliza.v1.ElizaService",
    methodName: "Say",
    input: {
      sentence: "hello there",
    },
    cardinality: "finite",
  }
]
```

The factory [`createConnectQueryKey`](#createconnectquerykey) makes it easy to create a key for an RPC query.


## Testing

Connect-query (along with all other javascript based connect packages) can be tested with the `createRouterTransport` function from `@connectrpc/connect`. This function allows you to create a transport that can be used to test your application without needing to make any network requests. We also have a dedicated package, [@connectrpc/connect-playwright](https://github.com/connectrpc/connect-playwright-es) for testing within [playwright](https://playwright.dev/).

For playwright, you can see a sample test [here](https://github.com/connectrpc/connect-playwright-es/blob/main/packages/connect-playwright-example/tests/simple.spec.ts).

## Frequently Asked Questions

### How do I pass other TanStack Query options?

Each function that interacts with TanStack Query also provides for options that can be passed through.

```ts
import { useQuery } from '@connectrpc/connect-query';
import { example } from 'your-generated-code/example-ExampleService_connectquery';

export const Example: FC = () => {
  const { data } = useQuery(example, undefined, {
    // These are typesafe options that are passed to underlying TanStack Query.
    refetchInterval: 1000,
  });
  return <div>{data}</div>;
};
```

> Why was this changed from the previous version of Connect-Query?
>
> Originally, all we did was pass options to TanStack Query. This was done as an intentional way to keep ourselves separate from TanStack Query. However, as usage increased, it became obvious that were still tied to the API of TanStack Query, and it only meant that we increased the burden on the developer to understand that underlying connection. This new API removes most of that burden and reduces the surface area of the API significantly.

### What is Connect-Query's relationship to Connect-Web and Protobuf-ES?

Here is a high-level overview of how Connect-Query fits in with Connect-Web and Protobuf-ES:

<details>
<summary>Expand to see a detailed dependency graph</summary>

<!-- markdownlint-disable-next-line MD033 -- 033: necessary for setting the width; -->

<img
  alt="connect-query_dependency_graph"
  src="./assets/connect-query_dependency_graph.png"
  width="75%"
/>

</details>

Your Protobuf files serve as the primary input to the code generators `protoc-gen-connect-query` and `protoc-gen-es`. Both of these code generators also rely on primitives provided by Protobuf-ES. The Buf CLI produces the generated output. The final generated code uses `Transport` from Connect-Web and generates a final Connect-Query API.

### What is `Transport`

`Transport` is a regular JavaScript object with two methods, `unary` and `stream`. See the definition in the Connect-Web codebase [here](https://github.com/connectrpc/connect-es/blob/main/packages/connect/src/transport.ts). `Transport` defines the mechanism by which the browser can call a gRPC-web or Connect backend. Read more about Transport on the [connect docs](https://connectrpc.com/docs/web/choosing-a-protocol).

### What if I already use Connect-Web?

You can use Connect-Web and Connect-Query together if you like!

### What if I use gRPC-web?

Connect-Query also supports gRPC-web! All you need to do is make sure you call `createGrpcWebTransport` instead of `createConnectTransport`.

That said, we encourage you to check out the [Connect protocol](https://connectrpc.com/docs/protocol/), a simple, POST-only protocol that works over HTTP/1.1 or HTTP/2. It supports server-streaming methods just like gRPC-Web, but is easy to debug in the network inspector.

### Do I have to use a code generator?

No. The code generator just generates the method descriptors, but you are free to do that yourself if you wish.

### What if I have a custom `Transport`?

If the `Transport` attached to React Context via the `TransportProvider` isn't working for you, then you can override transport at every level. For example, you can pass a custom transport directly to the lowest-level API like `useQuery` or `callUnaryMethod`.

### Does this only work with React?

Connect-Query does require React, but the core (`createConnectQueryKey` and `callUnaryMethod`) is not React specific so splitting off a `connect-solid-query` is possible.

### How do I do Prefetching?

When you might not have access to React context, you can use the `create` series of functions and provide a transport directly. For example:

```ts
import { say } from "./gen/eliza-ElizaService_connectquery";

function prefetch() {
  return queryClient.prefetchQuery({
    queryKey: createConnectQueryKey({
      schema: say,
      transport: myTransport,
      input: { sentence: "Hello" },
    }),
    queryFn: () => callUnaryMethod(myTransport, say, { sentence: "Hello" }),
  });
}
```

> [!TIP]
>
> Transports are taken into consideration when building query keys. If you want to prefetch queries on the server, and hydrate them in the client, make sure to use the same transport key on both sides with [`addStaticKeyToTransport`](#addstatickeytotransport).


### What about Streaming?

Connect-Query currently only supports Unary RPC methods, which use a simple request/response style of communication similar to GET or POST requests in REST. This is because it aligns most closely with TanStack Query's paradigms. However, we understand that there may be use cases for Server Streaming, Client Streaming, and Bidirectional Streaming, and we're eager to hear about them.

At Buf, we strive to build software that solves real-world problems, so we'd love to learn more about your specific use case. If you can provide a small, reproducible example, it will help us shape the development of a future API for streaming with Connect-Query.

To get started, we invite you to open a pull request with an example project in the examples directory of the Connect-Query repository. If you're not quite sure how to implement your idea, don't worry - we want to see how you envision it working. If you already have an isolated example, you may also provide a simple CodeSandbox or Git repository.

If you're not yet at the point of creating an example project, feel free to open an issue in the repository and describe your use case. We'll follow up with questions to better understand your needs.

Your input and ideas are crucial in shaping the future development of Connect-Query. We appreciate your input and look forward to hearing from you.

## Legal

Offered under the [Apache 2 license](/LICENSE).
