// Copyright 2021-2022 Buf Technologies, Inc.
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

import type { DescFile, DescService } from '@bufbuild/protobuf';
import { codegenInfo, MethodKind } from '@bufbuild/protobuf';
import type { Schema } from '@bufbuild/protoplugin';
import { localName } from '@bufbuild/protoplugin/ecmascript';

import type { PluginInit } from './utils';
import { getImportHookFromOption, reactHookName } from './utils';

const { safeIdentifier } = codegenInfo;

// prettier-ignore
/**
 * Handles generating a TypeScript Declaration file for a given Schema, DescFile (protobuf definition) and protobuf Service.
 */
const generateServiceFile =
  (schema: Schema, protoFile: DescFile) => (service: DescService) => {

    const f = schema.generateFile(
        `${protoFile.name}-${localName(service)}_connectquery_react.d.ts`,
    );
    f.preamble(protoFile);

    const importHookFrom = getImportHookFromOption(schema);

    service.methods.forEach((method) => {
      switch (method.methodKind) {
        case MethodKind.Unary:
          {
            const serviceName = safeIdentifier(localName(method));
            const partialMessage = f.import('PartialMessage', '@bufbuild/protobuf');
            const connectError = f.import('ConnectError', '@bufbuild/connect');
            const connectQueryKey = f.import("ConnectQueryKey", "@bufbuild/connect-query");

            f.print(
              `export const `,
              serviceName,
              `: `,
              f.import('UnaryHooks', '@bufbuild/connect-query'),
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
            f.print(`    inputs: Parameters<typeof `,serviceName, `.useQuery>[0],`);
            f.print(`    options?: Parameters<typeof `, serviceName, `.useQuery>[1],`,);
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
            f.print(`    options?: Parameters<typeof `, serviceName, `.useMutation>[0],`);
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
            f.print(`    inputs: Parameters<typeof `, serviceName, `.useInfiniteQuery>[0],`);
            f.print(`    options: Parameters<typeof `, serviceName, `.useInfiniteQuery>[1],`);
            f.print(`    queryOptions?: Partial<`, useInfiniteQueryOptions, `<`, method.output, `, `, connectError, `, `, method.output, `, `, method.output, `, `, connectQueryKey, `<`, method.input, `>>>`);
            f.print(`) => `, useInfiniteQueryResult, `<`, method.output, `,`, connectError, `>;`);
            f.print(``);
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
export const generateDts: PluginInit['generateDts'] = (schema) => {
  schema.files.forEach((protoFile) => {
    protoFile.services.forEach(generateServiceFile(schema, protoFile));
  });
};
