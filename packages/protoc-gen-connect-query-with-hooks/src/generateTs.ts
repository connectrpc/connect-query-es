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
  literalString,
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

    const { MethodKind: rtMethodKind } = schema.runtime;

    service.methods
      .filter((method) => method.methodKind === MethodKind.Unary)
      .forEach((method, index, filteredMethods) => {
        const serviceName = safeIdentifier(localName(method));
        
        const partialMessage = f.import('PartialMessage', "@bufbuild/protobuf");
        const connectError = f.import('ConnectError', "@bufbuild/connect");

        
        f.print(makeJsDoc(method));

        // createQueryService
        f.print(
          `export const ${serviceName} = `,
          f.import('createQueryService', '@bufbuild/connect-query'),
          `({`,
        );
        f.print(`  service: {`);
        f.print(`    methods: {`);
        f.print(`      ${localName(method)}: {`);
        f.print(`        name: ${literalString(method.name)},`);
        f.print(
          `        kind: `,
          rtMethodKind,
          `.${MethodKind[method.methodKind]},`,
        );
        f.print(`        I: `, method.input, `,`);
        f.print(`        O: `, method.output, `,`);
        f.print(`      },`);
        f.print(`    },`);
        f.print(`    typeName: ${literalString(service.typeName)},`);
        f.print(`  },`);
        f.print(`}).${localName(method)};`); // Note, the reason for dot accessing the method rather than destructuring at the top is that it allows for a TSDoc to be attached to the exported variable.  Also it's nice that each method has its own atomic section that you could independently inspect and debug (i.e. commenting a single method is much easier when it's one contiguous set of lines).
        f.print(``);

        // convert serviceName to first letter uppercase
        const serviceNameFirstLetterUppercase = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
        
        // useQuery
        const useQuery = f.import('useQuery', importHookFrom);
        const useBaseQueryOptions = f.import('UseBaseQueryOptions', importHookFrom);

        f.print(
          `export const use`, serviceNameFirstLetterUppercase, 'Query = '); // Note, the reason for dot accessing the method rather than destructuring at the top is that it allows for a TSDoc to be attached to the exported variable.  Also it's nice that each method has its own atomic section that you could independently inspect and debug (i.e. commenting a single method is much easier when it's one contiguous set of lines).
        f.print(`  (`);
        f.print(`    inputs: Parameters<typeof `, serviceName, `.useQuery>[0],`);
        f.print(`    options: Parameters<typeof `, serviceName, `.useQuery>[1],`);
        f.print(`    queryOptions?: Partial<`, useBaseQueryOptions, `<`, partialMessage, `<`, method.input, `>, `, connectError, `>>`);
        f.print(`  ) => {`);
        f.print(`    const baseOptions = `, serviceName, `.useQuery(inputs, options);`);
        f.print(``);
        f.print(`    return `, useQuery, `({`);
        f.print(`      ...baseOptions,`);
        f.print(`      ...queryOptions,`);
        f.print(`    });`);
        f.print(`  };`);
        f.print(``);

        // useMutation
        const useMutation = f.import('useMutation', importHookFrom);
        const useMutationOptions = f.import('UseMutationOptions', importHookFrom);


        f.print(  
          `export const use`, serviceNameFirstLetterUppercase, 'Mutation = ');
        f.print(`  (`);
        f.print(`    options: Parameters<typeof `, serviceName, `.useMutation>[0],`);
        f.print(`    queryOptions?: Partial<`, useMutationOptions, `<`, partialMessage, `<`, method.output, `>, `, connectError, `, `, partialMessage, `<`, method.input, `>>>`);
        f.print(`  ) => {`);
        f.print(`    const baseOptions = `, serviceName, `.useMutation(options);`);
        f.print(``);
        f.print(`    return `, useMutation, `({`);
        f.print(`      ...baseOptions,`);
        f.print(`      ...queryOptions,`);
        f.print(`    });`);
        f.print(`  };`);
        f.print(``);

        // useInfiniteQuery
        const useInfiniteQuery = f.import('useInfiniteQuery', importHookFrom);
        const useInfiniteQueryOptions = f.import('UseInfiniteQueryOptions', importHookFrom);


        f.print(
          `export const use`, serviceNameFirstLetterUppercase, 'InfiniteQuery = ');
        f.print(`  (`);
        f.print(`    inputs: Parameters<typeof `, serviceName, `.useInfiniteQuery>[0],`);
        f.print(`    options: Parameters<typeof `, serviceName, `.useInfiniteQuery>[1],`);
        f.print(`    queryOptions?: Partial<`, useInfiniteQueryOptions, `<`, partialMessage, `<`, method.input, `>, `, connectError, `>>`);
        f.print(`  ) => {`);
        f.print(`    const baseOptions = `, serviceName, `.useInfiniteQuery(inputs, options);`);
        f.print(``);
        f.print(`    return `, useInfiniteQuery, `({`);
        f.print(`      ...baseOptions,`);
        f.print(`      ...queryOptions,`);
        f.print(`    });`);
        f.print(`  };`);
        
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
