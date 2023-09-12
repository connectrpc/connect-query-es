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
 * Handles generating a source code file for a given Schema, DescFile (protobuf definition) and protobuf Service.
 *
 * By pure luck, this file happens to be completely valid JavaScript since all the types are inferred.
 */
const generateServiceFile =
  (schema: Schema, protoFile: DescFile, extension: 'js' | 'ts') =>
  (service: DescService) => {

    const f = schema.generateFile(
        `${protoFile.name}-${localName(service)}_connectquery_react.${extension}`,
    );
    f.preamble(protoFile);

    const importHookFrom = getImportHookFromOption(schema);

    const { MethodKind: rtMethodKind, MethodIdempotency: rtMethodIdempotency } =
      schema.runtime;

    f.print(makeJsDoc(service));
    f.print("export const ", localName(service), " = {");
    f.print(`  typeName: `, literalString(service.typeName), `,`);
    f.print("  methods: {");
    for (const method of service.methods) {
      f.print(makeJsDoc(method, "    "));
      f.print("    ", localName(method), ": {");
      f.print(`      name: `, literalString(method.name), `,`);
      f.print("      I: ", method.input, ",");
      f.print("      O: ", method.output, ",");
      f.print("      kind: ", rtMethodKind, ".", MethodKind[method.methodKind], ",");
      if (method.idempotency !== undefined) {
          f.print("      idempotency: ", rtMethodIdempotency, ".", MethodIdempotency[method.idempotency], ",");
      }
      // In case we start supporting options, we have to surface them here
      f.print("    },");
    }
    f.print("  }");
    f.print("} as const;");
    f.print();

    f.print(
      `const queryService = `,
      f.import('createQueryService', '@connectrpc/connect-query'),
      `({`,
    );
    f.print(`  service: `, localName(service), `,`);
    f.print(`})`);

    service.methods
      .filter((method) => method.methodKind === MethodKind.Unary)
      .forEach((method, index, filteredMethods) => {
        const serviceName = safeIdentifier(localName(method));

        const partialMessage = f.import('PartialMessage', '@bufbuild/protobuf');
        const connectError = f.import('ConnectError', '@connectrpc/connect');
        const connectQueryKey = f.import("ConnectQueryKey", "@connectrpc/connect-query");
        const useTransport = f.import('useTransport', "@connectrpc/connect-query");

        f.print(makeJsDoc(method));

        // createQueryService
        f.print(
          `export const ${serviceName} = queryService.${localName(method)};`); // Note, the reason for dot accessing the method rather than destructuring at the top is that it allows for a TSDoc to be attached to the exported variable.  Also it's nice that each method has its own atomic section that you could independently inspect and debug (i.e. commenting a single method is much easier when it's one contiguous set of lines).
        f.print(``);

        // useQuery
        const useQuery = f.import('useQuery', importHookFrom);
        const useQueryOptions = f.import(
          'UseQueryOptions',
          importHookFrom,
        );

        f.print(`export const `, reactHookName(method, 'Query'), ' = (');
        f.print(`    input?: Parameters<typeof `,serviceName, `.createUseQueryOptions>[0],`);
        f.print(`    options?: Parameters<typeof `, serviceName, `.createUseQueryOptions>[1],`,);
        f.print(`    queryOptions?: Partial<`, useQueryOptions, `<`,  method.output, `, `, connectError, `, `, method.output, `, `, connectQueryKey, `<`, method.input, `>>>`);
        f.print(`) => {`);
        f.print(`    const transport = `, useTransport, `();`);
        f.print(`    const baseOptions = `, serviceName, `.createUseQueryOptions(input, { transport, ...options });`);
        f.print(``);
        f.print(`    return `, useQuery, `({`);
        f.print(`        ...baseOptions,`);
        f.print(`        ...queryOptions,`);
        f.print(`    });`);
        f.print(`};`);
        f.print(``);

        // useMutation
        const useMutation = f.import('useMutation', importHookFrom);
        const useMutationOptions = f.import(
          'UseMutationOptions',
          importHookFrom,
        );

        f.print(`export const `, reactHookName(method, 'Mutation'), ' = (');
        f.print(`    options?: Parameters<typeof `, serviceName, `.createUseMutationOptions>[0],`);
        f.print(`    queryOptions?: Partial<`, useMutationOptions, `<`, partialMessage, `<`, method.output, `>, `, connectError, `, `, partialMessage, `<`, method.input, `>>>`);
        f.print(`) => {`);
        f.print(`    const transport = `, useTransport, `();`);
        f.print(`    const baseOptions = `, serviceName, `.createUseMutationOptions({ transport, ...options });`);
        f.print(``);
        f.print(`    return `, useMutation, `({`);
        f.print(`        ...baseOptions,`);
        f.print(`        ...queryOptions,`);
        f.print(`    });`);
        f.print(`};`);
        f.print(``);

        // useInfiniteQuery
        const useInfiniteQuery = f.import('useInfiniteQuery', importHookFrom);
        const useInfiniteQueryOptions = f.import(
          'UseInfiniteQueryOptions',
          importHookFrom,
        );
        f.print(`export const `, reactHookName(method, 'InfiniteQuery'), ' = (');
        f.print(`    input: Parameters<typeof `, serviceName, `.createUseInfiniteQueryOptions>[0],`);
        f.print(`    options: Parameters<typeof `, serviceName, `.createUseInfiniteQueryOptions>[1],`);
        f.print(`    queryOptions?: Partial<`, useInfiniteQueryOptions, `<`, method.output, `, `, connectError, `, `, method.output, `, `, method.output, `, `, connectQueryKey, `<`, method.input, `>>>`);
        f.print(`) => {`);
        f.print(`    const transport = `, useTransport, `();`);
        f.print(`    const baseOptions = `, serviceName, `.createUseInfiniteQueryOptions(input, { transport, ...options });`);
        f.print(``);
        f.print(`    return `, useInfiniteQuery, `<`, method.output, `, `, connectError, `, `, method.output, `, keyof typeof input extends never ? any : `, connectQueryKey, `<`, method.input, `>>({`);
        f.print(`        ...baseOptions,`);
        f.print(`        ...queryOptions,`);
        f.print(`    });`);
        f.print(`};`);
        f.print(``);

        // invalidateQueries
        const useQueryClient = f.import('useQueryClient', importHookFrom);
        const queryClient = f.import('QueryClient', importHookFrom);
        f.print(`export function `, reactHookName(method, 'InvalidateQueries'), '() {');
        f.print(`    const queryClient = `, useQueryClient, `();`);
        f.print(``);
        f.print(`    return (`);
        f.print(`      input?: Parameters<typeof `, serviceName, `.getQueryKey>[0],`);
        f.print(`      filters?: Parameters<`, queryClient ,`["invalidateQueries"]>[1],`);
        f.print(`      options?: Parameters<`, queryClient ,`["invalidateQueries"]>[2]`);
        f.print(`    ) => {`);
        f.print(``);
        f.print(`      return queryClient.invalidateQueries(`, serviceName, `.getQueryKey(input), filters, options);`);
        f.print(`    };`);
        f.print(`}`);

        const lastIndex = index === filteredMethods.length - 1;
        if (!lastIndex) {
          f.print();
        }
      });
  };

/**
 * This function generates the TypeScript output files
 */
export const generateTs: PluginInit["generateJs"] & PluginInit["generateTs"] = (
  schema,
  extension,
) => {
  schema.files.forEach((protoFile) => {
    protoFile.services.forEach(
      generateServiceFile(schema, protoFile, extension),
    );
  });
};
