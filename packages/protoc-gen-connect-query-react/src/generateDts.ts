// Copyright 2021-2023 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type { DescFile, DescService } from "@bufbuild/protobuf";
import { codegenInfo, MethodIdempotency, MethodKind } from "@bufbuild/protobuf";
import type { Schema } from "@bufbuild/protoplugin";
import {
  literalString,
  localName,
  makeJsDoc,
} from "@bufbuild/protoplugin/ecmascript";

import type { PluginInit } from "./utils";
import { getImportHookFromOption, reactHookName } from "./utils";

const { safeIdentifier } = codegenInfo;

// prettier-ignore
/**
 * Handles generating a TypeScript Declaration file for a given Schema, DescFile (protobuf definition) and protobuf Service.
 */
const generateServiceFile =
  (schema: Schema, protoFile: DescFile) => (service: DescService) => {
    const { MethodKind: rtMethodKind, MethodIdempotency: rtMethodIdempotency } = schema.runtime;

    const f = schema.generateFile(
        `${protoFile.name}-${localName(service)}_connectquery_react.d.ts`,
    );
    f.preamble(protoFile);

    f.print(makeJsDoc(service));
    f.print("export declare const ", localName(service), ": {");
    f.print(`  readonly typeName: `, literalString(service.typeName), `,`);
    f.print("  readonly methods: {");
    for (const method of service.methods) {
      f.print(makeJsDoc(method, "    "));
      f.print("    readonly ", localName(method), ": {");
      f.print(`      readonly name: `, literalString(method.name), `,`);
      f.print("      readonly I: typeof ", method.input, ",");
      f.print("      readonly O: typeof ", method.output, ",");
      f.print("      readonly kind: ", rtMethodKind, ".", MethodKind[method.methodKind], ",");
      if (method.idempotency !== undefined) {
        f.print("      readonly idempotency: ", rtMethodIdempotency, ".", MethodIdempotency[method.idempotency], ",");
      }
      // In case we start supporting options, we have to surface them here
      f.print("    },");
    }
    f.print("  }");
    f.print("};");
    f.print();

    const importHookFrom = getImportHookFromOption(schema);

    service.methods.forEach((method) => {
      switch (method.methodKind) {
        case MethodKind.Unary:
          {
            const serviceName = safeIdentifier(localName(method));
            const partialMessage = f.import('PartialMessage', '@bufbuild/protobuf');
            const connectError = f.import('ConnectError', '@connectrpc/connect');
            const connectQueryKey = f.import("ConnectQueryKey", "@connectrpc/connect-query");

            f.print(
              `export const `,
              serviceName,
              `: `,
              f.import('UnaryFunctions', '@connectrpc/connect-query'),
              `<`,
              method.input,
              `, `,
              method.output,
              `>;`,
            );

            // useQuery
            const useQueryOptions = f.import(
              'UseQueryOptions',
              importHookFrom,
            );
            const useQueryResult = f.import(
                'UseQueryResult',
                importHookFrom,
            );

            f.print(`export declare const `, reactHookName(method, 'Query'), ': (');
            f.print(`    input: Parameters<typeof `,serviceName, `.createUseQueryOptions>[0],`);
            f.print(`    options?: Parameters<typeof `, serviceName, `.createUseQueryOptions>[1],`,);
            f.print(`    queryOptions?: Partial<`, useQueryOptions, `<`,  method.output, `, `, connectError, `, `, method.output, `, `, connectQueryKey, `<`, method.input, `>>>`);

            f.print(`) => `, useQueryResult, `<`, method.output, `,`, connectError, `>;`);
            f.print(``);

            // useMutation
            const useMutationOptions = f.import(
                'UseMutationOptions',
                importHookFrom,
            );
            const useMutationResult = f.import(
                'UseMutationResult',
                importHookFrom,
            );

            f.print(`export declare const `, reactHookName(method, 'Mutation'), ': (');
            f.print(`    options?: Parameters<typeof `, serviceName, `.createUseMutationOptions>[0],`);
            f.print(`    queryOptions?: Partial<`, useMutationOptions, `<`, partialMessage, `<`, method.output, `>, `, connectError, `, `, partialMessage, `<`, method.input, `>>>`);
            f.print(`) => `, useMutationResult, `<`, method.output, `,`, connectError, ',', partialMessage, `<`, method.input, '>',`, unknown>;`);
            f.print(``);

            // useInfiniteQuery
            const useInfiniteQueryOptions = f.import(
                'UseInfiniteQueryOptions',
                importHookFrom,
            );
            const useInfiniteQueryResult = f.import(
                'UseInfiniteQueryResult',
                importHookFrom,
            );

            f.print(`export declare const `, reactHookName(method, 'InfiniteQuery'), ': (');
            f.print(`    input: Parameters<typeof `, serviceName, `.createUseInfiniteQueryOptions>[0],`);
            f.print(`    options: Parameters<typeof `, serviceName, `.createUseInfiniteQueryOptions>[1],`);
            f.print(`    queryOptions?: Partial<`, useInfiniteQueryOptions, `<`, method.output, `, `, connectError, `, `, method.output, `, `, method.output, `, `, connectQueryKey, `<`, method.input, `>>>`);
            f.print(`) => `, useInfiniteQueryResult, `<`, method.output, `,`, connectError, `>;`);
            f.print(``);

            // invalidateQueries
            const queryClient = f.import('QueryClient', importHookFrom);

            f.print(`export declare function `, reactHookName(method, 'InvalidateQueries'), '(): (');
            f.print(`  input?: Parameters<typeof `, serviceName, `.getQueryKey>[0],`);
            f.print(`  filters?: Parameters<`, queryClient ,`["invalidateQueries"]>[1],`);
            f.print(`  options?: Parameters<`, queryClient ,`["invalidateQueries"]>[2]`);
            f.print(') => Promise<void>');f.print(``);
          }
          break;

        default:
          return;
      }
    });
  };

/**
 * This function generates the TypeScript Definition output files
 */
export const generateDts: PluginInit["generateDts"] = (schema) => {
  schema.files.forEach((protoFile) => {
    protoFile.services.forEach(generateServiceFile(schema, protoFile));
  });
};
