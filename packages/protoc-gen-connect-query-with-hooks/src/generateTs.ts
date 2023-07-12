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
import {
  localName,
  makeJsDoc,
} from '@bufbuild/protoplugin/ecmascript';

import type { PluginInit } from './utils';

const { safeIdentifier } = codegenInfo;

/**
 * Handles generating a source code file for a given Schema, DescFile (protobuf definition) and protobuf Service.
 *
 * By pure luck, this file happens to be completely valid JavaScript since all the types are inferred.
 */
const generateServiceFile =
  (schema: Schema, protoFile: DescFile, extension: 'js' | 'ts') =>
  (service: DescService) => {
    const parameter = schema.proto.parameter?.split(",").reduce<object>((acc, curr) => {
      const [key, value] = curr.split("=")
      
      acc = Object.assign(acc, {[key]: value})

      return acc
    }, {})

    const importHookFrom = parameter && 'import-hook-from' in parameter && typeof parameter['import-hook-from'] == "string" ? parameter['import-hook-from'] : '@tanstack/react-query';


    const f = schema.generateFile(
      `${protoFile.name}-${localName(service)}_connectquery_hooks.${extension}`,
    );
    f.preamble(protoFile);

    const connectQueryFile = `./${protoFile.name}-${localName(service)}_connectquery.${extension}`;

    service.methods
      .filter((method) => method.methodKind === MethodKind.Unary)
      .forEach((method, index, filteredMethods) => {
        const literalMethodName = safeIdentifier(localName(method));

        const serviceName = f.import(literalMethodName, connectQueryFile);
        
        f.print(makeJsDoc(method));

        // convert serviceName to first letter uppercase
        const serviceNameFirstLetterUppercase = literalMethodName.charAt(0).toUpperCase() + literalMethodName.slice(1);
        // useQuery
        const useQuery = f.import('useQuery', importHookFrom);
        f.print(
          `export const use`, serviceNameFirstLetterUppercase, 'Query = '); // Note, the reason for dot accessing the method rather than destructuring at the top is that it allows for a TSDoc to be attached to the exported variable.  Also it's nice that each method has its own atomic section that you could independently inspect and debug (i.e. commenting a single method is much easier when it's one contiguous set of lines).
        f.print(`  (...inputs: Parameters<typeof `, serviceName, `.useQuery>) => `, useQuery, '(', serviceName, `.useQuery(inputs)`, ');');
        f.print()

        // useMutation
        const useMutation = f.import('useMutation', importHookFrom);
        f.print(  
          `export const use`, serviceNameFirstLetterUppercase, 'Mutation = ');
        f.print(`  (...inputs: Parameters<typeof `, serviceName, `.useMutation>) => `, useMutation, '(', serviceName, `.useMutation(inputs)`, ');');
        f.print()

        // useInfiniteQuery
        const useInfiniteQuery = f.import('useInfiniteQuery', importHookFrom);
        f.print(
          `export const use`, serviceNameFirstLetterUppercase, 'InfiniteQuery = ');
        f.print(`  (...inputs: Parameters<typeof `, serviceName, `.useInfiniteQuery>) => `, useInfiniteQuery, '(', serviceName, `.useInfiniteQuery(inputs)`, ');');

        const lastIndex = index === filteredMethods.length - 1;
        if (!lastIndex) {
          f.print();
        }
      });
  };

/**
 * This function generates the TypeScript output files
 */
export const generateTs: PluginInit['generateJs'] & PluginInit['generateTs'] = (
  schema,
  extension,
) => {
  schema.files.forEach((protoFile) => {
    protoFile.services.forEach(
      generateServiceFile(schema, protoFile, extension),
    );
  });
};
