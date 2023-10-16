// Copyright 2021-2023 The Connect Authors
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
    const isTs = extension === "ts";
    const f = schema.generateFile(
      `${protoFile.name}-${localName(service)}_connectquery.${extension}`,
    );
    f.preamble(protoFile);

    f.print(`export const typeName = ${literalString(service.typeName)};`);
    f.print();

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
    f.print("}", isTs ? " as const" : "", ";");
    f.print();

    f.print(`const $queryService = `,
      f.import('createQueryService', '@connectrpc/connect-react-query'),
      `({`,
      `  service: `, localName(service), `,`,
      `});`
    );
    f.print();

    service.methods
      .filter((method) => method.methodKind === MethodKind.Unary)
      .forEach((method, index, filteredMethods) => {
        f.print(makeJsDoc(method));
        const methodTsType = [
          ": ",
          f.import('UnaryFunctionsWithHooks', '@connectrpc/connect-react-query'),
          `<${method.input.name}, ${method.output.name}>`
        ]
        
        f.print(
          `export const ${safeIdentifier(localName(method))}`, ...(isTs ? methodTsType : []), ` = { `,
          `  ...$queryService.${localName(method)},`,
          `  ...`, f.import('createUnaryHooks', '@connectrpc/connect-react-query'),`($queryService.${localName(method)})`,
          `};`
        );

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
