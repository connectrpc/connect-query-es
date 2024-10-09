# @connectrpc/protoc-gen-connect-query

- [@connectrpc/protoc-gen-connect-query](#connectrpcprotoc-gen-connect-query)
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
    - [`import_extension`](#import_extension)
    - [`keep_empty_files=true`](#keep_empty_filestrue)
    - [`js_import_style`](#js_import_style)
    - [`ts_nocheck=true`](#ts_nochecktrue)
  - [Example Generated Code](#example-generated-code)

The code generator for Connect-Query, a expansion pack for [TanStack Query](https://tanstack.com/query) (react-query), that enables effortless communication with servers that speak the [Connect Protocol](https://connectrpc.com/docs/protocol).

Learn more about Connect-Query at [github.com/connectrpc/connect-query-es](https://github.com/connectrpc/connect-query-es).

## Installation

`protoc-gen-connect-query` is a code generator plugin for Protocol Buffer compilers like [buf](https://github.com/bufbuild/buf) and [protoc](https://github.com/protocolbuffers/protobuf/releases). It generates clients from your Protocol Buffer schema, and works in tandem with
[@bufbuild/protoc-gen-es](https://www.npmjs.com/package/@bufbuild/protoc-gen-es), the code generator plugin for all Protocol Buffer base types. The code those two plugins generate requires the runtime libraries [@connectrpc/connect-query](https://www.npmjs.com/package/@connectrpc/connect-query), and [@bufbuild/protobuf](https://www.npmjs.com/package/@bufbuild/protobuf).

To install the plugins and their runtime libraries, run:

```shell
npm install --save-dev @connectrpc/protoc-gen-connect-query @bufbuild/protoc-gen-es
npm install @connectrpc/connect-query @bufbuild/protobuf
```

We use peer dependencies to ensure that code generator and runtime library are compatible with each other. Note that yarn and pnpm only emit a warning in this case.

## Generating Code

### `example.proto`

For these examples, consider the following example proto file `example.proto`:

```protobuf
syntax = "proto3";

package example.v1;

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
version: v2
plugins:
  # This will invoke protoc-gen-es and write output to src/gen
  - local: protoc-gen-es
    out: src/gen
    opt: target=ts
    # This will invoke protoc-gen-connect-query
  - local: protoc-gen-connect-query
    out: src/gen
    opt: target=ts
```

### With the `buf` CLI

To use the [buf CLI](https://docs.buf.build/generate/usage#run-generate) to generate code for all protobuf files within your project, simply run:

```bash
npx @bufbuild/buf generate
```

> Note that `buf` can generate from various [inputs](https://docs.buf.build/reference/inputs), not just local protobuf files. For example, `npm run generate buf.build/connectrpc/eliza` generates code for the module [connectrpc/eliza](https://buf.build/connectrpc/eliza) on the Buf Schema Registry.

### With `protoc`

```bash
PATH=$PATH:$(pwd)/node_modules/.bin \
  protoc -I . \
  --es_out src/gen \
  --es_opt target=ts \
  --connect-query_out src/gen \
  --connect-query_opt target=ts \
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
    "buf:generate": "buf generate"
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

## Generated Output

Connect-Query will create one output file for every service in every protofile. Say you have the following file structure:

```tree
.
└── proto/
    ├── pizza.proto
    └── curry.proto
```

Where `pizza.proto` contains `DetroitStyleService` and `ChicagoStyleService`, and where `curry.proto` contains `VindalooService`. Your generated output will look like this:

```tree
.
└── gen/
    ├── pizza_pb.ts
    ├── pizza-DetroitStyleService_connectquery.ts
    ├── pizza-ChicagoStyleService_connectquery.ts
    ├── curry_pb.ts
    └── curry-VindalooService_connectquery.ts
```

The reason each service gets a separate file is to facilitate intellisense and [language server protocol imports](https://github.com/typescript-language-server/typescript-language-server#organize-imports). Notice that one file per input proto is generated by `protoc-gen-es` (`pizza_pb.ts` and `curry_pb.ts`), and that one file per service is created by `protoc-gen-connect-query` (making up the remainder). The Protobuf-ES generated files (`*_pb.ts`) are important because those files are referenced from the `*_connectquery.ts` files.

## Plugin options

### `target`

This option controls whether the plugin generates JavaScript, TypeScript, or TypeScript declaration files.

Say, for example, you used [`example.proto`](#exampleproto):

| Target       | Generated output                        |
| ------------ | --------------------------------------- |
| `target=js`  | `example-TodoService_connectquery.js`   |
| `target=ts`  | `example-TodoService_connectquery.ts`   |
| `target=dts` | `example-TodoService_connectquery.d.ts` |

Multiple values can be given by separating them with `+`, for example `target=js+dts`.

By default, we generate JavaScript and TypeScript declaration files, which produces the smallest code size and is the most compatible with various bundler configurations. If you prefer to generate TypeScript, use `target=ts`.

### `import_extension`

By default, [protoc-gen-connect-query](https://www.npmjs.com/package/@connectrpc/protoc-gen-connect-query) (and all other plugins based on [@bufbuild/protoplugin](https://www.npmjs.com/package/@bufbuild/protoplugin)) doesn't add file extensions to import paths. However, some environments require an import extension. For example, using ECMAScript modules in Node.js requires the `.js` extension, and Deno requires `.ts`. With this plugin option, you can add `.js`/`.ts` extensions in import paths with the given value. Possible values:

- `import_extension=none`: Doesn't add an extension. (Default)
- `import_extension=js`: Adds the `.js` extension.
- `import_extension=ts`. Adds the `.ts` extension.

### `js_import_style`

By default, [protoc-gen-connect-query](https://www.npmjs.com/package/@connectrpc/protoc-gen-connect-query)
(and all other plugins based on [@bufbuild/protoplugin](https://www.npmjs.com/package/@bufbuild/protoplugin))
generate ECMAScript `import` and `export` statements. For use cases where
CommonJS is difficult to avoid, this option can be used to generate CommonJS
`require()` calls.

Possible values:

- `js_import_style=module` generate ECMAScript `import` / `export` statements -
  the default behavior.
- `js_import_style=legacy_commonjs` generate CommonJS `require()` calls.

### `keep_empty_files=true`

This option exists for other plugins but is not applicable to `protoc-gen-connect-query` because, unlike most other plugins, it does not generate a maximum of one output file for every input proto file. Instead, it generates one output file per service. If you provide a valid proto file that contains no services, `protoc-gen-connect-query` will have no output.

### `ts_nocheck=true`

[protoc-gen-connect-query](https://www.npmjs.com/package/@connectrpc/protoc-gen-connect-query) generates valid TypeScript for current versions of the TypeScript compiler with standard settings. If you use compiler settings that yield an error for generated code, setting this option generates an annotation at the top of each file to skip type checks: `// @ts-nocheck`.

## Example Generated Code

See [`eliza.proto`](../../examples/react/basic/eliza.proto) for example inputs, and look [here](../../examples/react/basic/src/gen) to see the outputs those files generate.
