# @bufbuild/protoc-gen-connect-query-react

**This is an experimental plugin, based on the [protoc-gen-connect-query](https://github.com/bufbuild/protoc-gen-connect-query) plugin. This plugin provides better DX while sacrificing some flexibility.**

Instead of generating a single entry point per method:

```tsx
import { getTodos } from "./example-TodoService_connectquery";
import { useQuery } from "@tanstack/react-query";

...

const Component = () => {
  const { data, isLoading } = useQuery(getTodos.useQuery());
}
```

This plugin generates several methods per method, that all wrap their equivalent in react-query:

```tsx
import { useGetTodosQuery } from "./example-TodoService_connectquery_react";

...

const Component = () => {
  const { data, isLoading } = useGetTodosQuery();
}
```

- [@bufbuild/protoc-gen-connect-query-react](#bufbuildprotoc-gen-connect-query-react)
  - [Installation](#installation)
  - [Generating Code](#generating-code)
    - [`example.proto`](#exampleproto)
    - [`buf.gen.yaml`](#bufgenyaml)
    - [With the `buf` CLI](#with-the-buf-cli)
    - [With `protoc`](#with-protoc)
    - [With Node](#with-node)
  - [Generated Output](#generated-output)
  - [Plugin options](#plugin-options)
    - [`target`](#target)
    - [`import_extension=.js`](#import_extensionjs)
    - [`keep_empty_files=true`](#keep_empty_filestrue)
    - [`import-hook-form=@tanstack/connect-query`](#import-hook-from)
  - [Example Generated Code](#example-generated-code)

The code generator for Connect-Query, a expansion pack for [TanStack Query](https://tanstack.com/query) (react-query), that enables effortless communication with servers that speak the [Connect Protocol](https://connect.build/docs/protocol).

Learn more about Connect-Query at [github.com/bufbuild/connect-query](https://github.com/bufbuild/connect-query).

## Installation

`protoc-gen-connect-query-react` is a code generator plugin for Protocol Buffer compilers like [buf](https://github.com/bufbuild/buf) and [protoc](https://github.com/protocolbuffers/protobuf/releases).  It generates clients from your Protocol Buffer schema, and works in tandem with
[@bufbuild/protoc-gen-es](https://www.npmjs.com/package/@bufbuild/protoc-gen-es), the code generator plugin for all Protocol Buffer base types.  The code those two plugins generate requires the runtime libraries [@bufbuild/connect-query](https://www.npmjs.com/package/@bufbuild/connect-query), and [@bufbuild/protobuf](https://www.npmjs.com/package/@bufbuild/protobuf).

To install the plugins and their runtime libraries, run:

```shell
npm install --save-dev @bufbuild/protoc-gen-connect-query-react @bufbuild/protoc-gen-es
npm install @bufbuild/connect-query @bufbuild/protobuf
```

We use peer dependencies to ensure that code generator and runtime library are compatible with each other. Note that yarn and pnpm only emit a warning in this case.

## Generating Code

### `example.proto`

For these examples, consider the following example proto file `example.proto`:

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

This file creates an RPC service with the following:

- `GetTodos` takes no inputs and returns an array of `Todo`s.
- `AddTodo` adds a new `Todo` and returns nothing.

### `buf.gen.yaml`

Add a new configuration file `buf.gen.yaml`

```yaml
version: v1
plugins:
    # This will invoke protoc-gen-es and write output to src/gen
  - name: es
    out: src/gen
    opt: target=ts

    # This will invoke protoc-gen-connect-query-react
  - name: connect-query-react
    opt: 
      - target=ts
      - import-hook-from=@tanstack/connect-query
    out: dist
```

### With the `buf` CLI

To use the [buf CLI](https://docs.buf.build/generate/usage#run-generate) to generate code for all protobuf files within your project, simply run:

```bash
npx @bufbuild/buf generate
```

> Note that `buf` can generate from various [inputs](https://docs.buf.build/reference/inputs), not just local protobuf files. For example, `npm run generate buf.build/bufbuild/eliza` generates code for the module [bufbuild/eliza](https://buf.build/bufbuild/eliza) on the Buf Schema Registry.

### With `protoc`

```bash
PATH=$PATH:$(pwd)/node_modules/.bin \
  protoc -I . \
  --es_out src/gen \
  --es_opt target=ts \
  --connect-query_out src/gen \
  --connect-query_opt target=ts \
  --connect-query-react_out src/gen \
  --connect-query-react_opt target=ts,import-hook-from=@tanstack/connect-query \
  example.proto
```

Note that we are adding `node_modules/.bin` to the `$PATH`, so that the protocol buffer compiler can find them. This happens automatically with npm scripts.

> Note: Since yarn v2 and above does not use a `node_modules` directory, you need to change the variable a bit:
>
> ```bash
> PATH=$(dirname $(yarn bin protoc-gen-es)):$(dirname $(yarn bin protoc-gen-connect-es)):$PATH
> ```

### With Node

Add a line to the `scripts` section of your `package.json` to run `buf generate`.

```json
"scripts": {
    ...
    "buf:generate": "npx @bufbuild/buf generate example.proto"
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
    └── example-TodoService_connectquery_react.ts
```

## Generated Output

Connect-Query will create one output file for every service in every protofile.  Say you have the following file structure:

```tree
.
└── proto/
    ├── pizza.proto
    └── curry.proto
```

Where `pizza.proto` contains `DetroitStyleService` and `ChicagoStyleService`, and where `curry.proto` contains `VindalooService`.  Your generated output will look like this:

```tree
.
└── gen/
    ├── pizza_pb.ts
    ├── pizza-DetroitStyleService_connectquery_react.ts
    ├── pizza-ChicagoStyleService_connectquery_react.ts
    ├── curry_pb.ts
    └── curry-VindalooService_connectquery_react.ts
```

The reason each service gets a separate file is to facilitate intellisense and [language server protocol imports](https://github.com/typescript-language-server/typescript-language-server#organize-imports).  Notice that one file per input proto is generated by `protoc-gen-es` (`pizza_pb.ts` and `curry_pb.ts`), and that one file per service is created by `protoc-gen-connect-query-react` (making up the remainder).  The Protobuf-ES generated files (`*_pb.ts`) are important because those files are referenced from the `*_connectquery_react.ts` files.

## Plugin options

### `target`

This option controls whether the plugin generates JavaScript, TypeScript, or TypeScript declaration files.

Say, for example, you used [`example.proto`](#exampleproto):

| Target | Generated output |
| - | - |
| `target=js` | `example-TodoService_connectquery_react.js` |
| `target=ts` | `example-TodoService_connectquery_react.ts` |
| `target=dts` | `example-TodoService_connectquery_react.d.ts` |

Multiple values can be given by separating them with `+`, for example `target=js+dts`.

By default, we generate JavaScript and TypeScript declaration files, which produces the smallest code size and is the most compatible with various bundler configurations. If you prefer to generate TypeScript, use `target=ts`.

### `import_extension=.js`

By default, [protoc-gen-connect-query-react](https://www.npmjs.com/package/@bufbuild/protoc-gen-connect-query-react) (and all other plugins based on [@bufbuild/protoplugin](https://www.npmjs.com/package/@bufbuild/protoplugin)) uses a `.js` file extensions in import paths, even in TypeScript files.

This is unintuitive, but necessary for [ECMAScript modules in Node.js](https://www.typescriptlang.org/docs/handbook/esm-node.html).

Unfortunately, not all bundlers and tools have caught up yet, and Deno requires `.ts`. With this plugin option, you can replace `.js` extensions in import paths with the given value. For example, set

- `import_extension=none` to remove the `.js` extension
- `import_extension=.ts` to replace the `.js` extension with `.ts`

### `keep_empty_files=true`

This option exists for other plugins but is not applicable to `protoc-gen-connect-query-react` because, unlike most other plugins, it does not generate a maximum of one output file for every input proto file.  Instead, it generates one output file per service.  If you provide a valid proto file that contains no services, `protoc-gen-connect-query-react` will have no output.

### `import-hook-from`

This option allows you to specify the import path for the `useQuery` hook.  By default, it is `@tanstack/connect-query`, but you can change it to whatever you want.  For example, if you want to use the `useQuery` hook from `@your-path/connect-query`, you would set `import-hook-from=@your-path/connect-query`.

## Example Generated Code

See [`example.proto`](https://github.com/bufbuild/connect-query/blob/main/packages/generated-react/example.proto) and [`eliza.proto`](https://github.com/bufbuild/connect-query/blob/main/packages/generated-react/eliza.proto) for example inputs, and look [here](https://github.com/bufbuild/connect-query/blob/main/packages/generated-react/dist) to see the outputs those files generate.
