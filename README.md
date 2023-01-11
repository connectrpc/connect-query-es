# Connect-Query

<!-- markdownlint-disable-next-line MD033 -- `p` tag is necessary for centering the image -->
<p align="center">
  <!-- markdownlint-disable-next-line MD033 -- `img` tag is necessary for setting width -->
  <img src="assets/connect-query@16x.png" width="50%" margin="auto" />
</p>

Connect-Query is an expansion pack for [TanStack Query](https://tanstack.com/query) (react-query), written in TypeScript and thoroughly tested.  It enables effortless communication with servers that speak the [Connect Protocol](https://connect.build/docs/protocol).

- [Connect-Query](#connect-query)
  - [Quickstart](#quickstart)
    - [Usage Example](#usage-example)
    - [How to generate code](#how-to-generate-code)
  - [Frequently Asked Questions](#frequently-asked-questions)
    - [What is Connect-Query's relationship to Connect-Web and Protobuf-ES?](#what-is-connect-querys-relationship-to-connect-web-and-protobuf-es)
    - [What is `Transport`](#what-is-transport)
    - [What if I already use Connect-Web?](#what-if-i-already-use-connect-web)
    - [What if I use gRPC-web?](#what-if-i-use-grpc-web)
    - [Do I have to use a code generator?](#do-i-have-to-use-a-code-generator)
    - [Does this only work with React?](#does-this-only-work-with-react)

## Quickstart

Connect-Query will immediately feel familiar to you if you've used TanStack Query.

### Usage Example

Connect-Query provides a set of convenient helpers that you can pass directly to the same TanStack Query calls you're already using:

```ts
import { useQuery } from '@tanstack/react-query';
import { example } from '<your-generated-code>/example-ExampleService_connectquery';

export const Example: FC = () => {
  const {
    error,
    //^? ConnectError | null
    data,
    //^? ExampleResponse | undefined
  } = useQuery(example.useQuery({}));
  //           ^? UnaryHooks<ExampleRequest, ExampleResponse>

  return <div>{data}</div>;
};
```

This example shows the best developer experience which uses code generation.  Here's what that generated code looks like:

```ts
import { createQueryService } from "@bufbuild/connect-query";
import { MethodKind } from "@bufbuild/protobuf";
import { ExampleRequest, ExampleResponse } from "./example_pb.js";

export const example = createQueryService({
  service: {
    methods: {
      example: {
        name: "Example",
        kind: MethodKind.Unary,
        I: ExampleRequest,
        O: ExampleResponse,
      },
    },
    typeName: "your.company.com.example.v1.ExampleService",
  },
}).example;
```

If you want to use Connect Query dynamically without code generation, you can call `createQueryService` exactly as the generated code does.

### How to generate code

Consider this simple proto file:

```protobuf
syntax = "proto3";

package buf.connect.demo.example.v1;

message Nothing {}

message Todo {
  string id = 1;
  string name = 2;
  bool completed = 3;
}

message Todos {
  repeated Todo todos = 1;
}

service TodoService {
  rpc GetTodos(Nothing) returns (Todos);
  rpc AddTodo(Todo) returns (Nothing);
}
```

This file creates an RPC with the following:

- `GetTodos` takes no inputs and returns an array of `Todo`s.
- `AddTodo` adds a new `Todo` and returns nothing.

Next, tell Buf to use the two plugins with a new configuration file named `buf.gen.yaml`:

```yaml title="buf.gen.yaml"
version: v1
plugins:
  - plugin: es
    out: gen
    opt: target=ts
  - plugin: connect-query
    out: gen
    opt: target=ts
```

Then, add a line to the `scripts` section of your `package.json` to run `buf generate`.  

```json
"scripts": {
    ...
    "buf:generate": "buf generate example.proto"
},
```

Finally, tell Buf to generate code by running your command:

```bash
npm run buf:generate
```

Now you should see your generated code:

```tree
.
└── gen/
    ├── example_pb.ts
    └── example-TodoService_connectquery.ts
```

## Frequently Asked Questions

### What is Connect-Query's relationship to Connect-Web and Protobuf-ES?

Here is a high-level overview of how Connect-Query fits in with Connect-Web and Protobuf-ES:

<!-- markdownlint-disable-next-line MD033 -- line break is necessary here because of the way excalidraw exports -->
<br/>
<!-- markdownlint-disable-next-line MD033 -- line break is necessary here because of the way excalidraw exports -->
<br/>

![connect-query_dependency_graph](./assets/connect-query_dependency_graph.png)

<!-- markdownlint-disable-next-line MD033 -- line break is necessary here because of the way excalidraw exports -->
<br/>
<!-- markdownlint-disable-next-line MD033 -- line break is necessary here because of the way excalidraw exports -->
<br/>

Your `*.proto` file serves as the primary input to the code generators `protoc-gen-connect-query` and `protoc-gen-es`.  Both of these code generators also rely on primitives provided by Protobuf-ES.  The Buf CLI produces the generated output.  The final generated code uses `Transport` from Connect-Web and generates a final Connect-Query API.  Then in your codebase you import the generated code.

> Note, you

### What is `Transport`

`Transport` is a regular JavaScript object with two methods, `unary` and `serverStream`:

```ts
/**
 * Transport represents the underlying transport for a client.
 * A transport implements a protocol, such as Connect or gRPC-web,
 * and allows for the concrete clients to be independent of the protocol.
 */
export interface Transport {
    /**
     * Call a unary RPC
     * a method that takes a single input message,
     * and responds with a single output message.
     */
    unary<
      I extends Message<I> = AnyMessage,
      O extends Message<O> = AnyMessage
    >(
      service: ServiceType,
      method: MethodInfo<I, O>,
      signal: AbortSignal | undefined,
      timeoutMs: number | undefined,
      header: HeadersInit | undefined,
      message: PartialMessage<I>
    ): Promise<UnaryResponse<O>>;

    /**
     * Call a server-streaming RPC
     * a method that takes a single input message,
     * and responds with zero or more output messages.
     */
    serverStream<
      I extends Message<I> = AnyMessage,
      O extends Message<O> = AnyMessage
    >(
      service: ServiceType,
      method: MethodInfo<I, O>,
      signal: AbortSignal | undefined,
      timeoutMs: number | undefined,
      header: HeadersInit | undefined,
      message: PartialMessage<I>
    ): Promise<StreamResponse<O>>;
}
```

While there are a lot of available options, the highlights are that `Transport` is the important mechanism by which calls to a gRPC-web or Connect backend are made from the browser.

### What if I already use Connect-Web?

You can use Connect-Web and Connect-Query together if you like!

### What if I use gRPC-web?

Connect-Query also supports gRPC-web!  All you need to do is make sure you call `createGrpcWebTransport` instead of `createConnectTransport`.

That said, we encourage you to check out the [Connect protocol](https://connect.build/docs/protocol/), a simple, POST-only protocol that works over HTTP/1.1 or HTTP/2. It supports server-streaming methods just like gRPC-Web, but is easy to debug in the network inspector.

### Do I have to use a code generator?

No.  The code generator just calls `createQueryService` with the arguments already added, but you are free to do that yourself if you wish.

### Does this only work with React?

You can use Connect-Query with any TanStack variant (React, Solid, Svelte, Vue).  However, since the hooks APIs like `useQuery` and `useMutation` automatically infer `Transport` from React Context, these APIs will only work with React, as of now.  There is nothing else React specific in the Connect-Query codebase.  As we expand the scope of the project, we do hope to support all APIs on all TanStack Query variants.

| Connect-Query API       | React              | Solid              | Svelte             | Vue             |
| ----------------------- | ------------------ | ------------------ | ------------------ | ------------------ |
| `createQueryService`    | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `createQueryHooks`      | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `isSupportedMethod`     | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `disableQuery`          | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `unaryHooks`            | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `createData`            | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `createUseQueryOptions` | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `getPartialQueryKey`    | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `getQueryKey`           | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `methodInfo`            | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `setQueryData`          | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `setQueriesData`        | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `useInfiniteQuery`      | :heavy_check_mark: | :x:                | :x:                | :x:                |
| `useMutation`           | :heavy_check_mark: | :x:                | :x:                | :x:                |
| `useQuery`              | :heavy_check_mark: | :x:                | :x:                | :x:                |
| `useQuery`              | :heavy_check_mark: | :x:                | :x:                | :x:                |
| `useTransport`          | :heavy_check_mark: | :x:                | :x:                | :x:                |
| `TransportProvider`     | :heavy_check_mark: | :x:                | :x:                | :x:                |

> If you're a TanStack Query user that uses something other than React, we'd love to hear from you.  Please reach out to us on the [Buf Slack](https://join.slack.com/t/bufbuild/shared_invite/zt-f5k547ki-VDs_iC4TblNCu7ubhRD17w).
