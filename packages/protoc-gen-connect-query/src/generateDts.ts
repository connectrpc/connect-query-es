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
import type { Schema } from "@bufbuild/protoplugin/ecmascript";
import { localName } from "@bufbuild/protoplugin/ecmascript";

import type { PluginInit } from "./utils.js";

const { safeIdentifier } = codegenInfo;

// prettier-ignore
/**
 * Handles generating a TypeScript Declaration file for a given Schema, DescFile (protobuf definition) and protobuf Service.
 */
const generateServiceFile =
  (schema: Schema, protoFile: DescFile) => (service: DescService) => {
    const { MethodKind: rtMethodKind, MethodIdempotency: rtMethodIdempotency } = schema.runtime;
    
    const f = schema.generateFile(
      `${protoFile.name}-${localName(service)}_connectquery.d.ts`,
    );

    f.preamble(protoFile);

    service.methods.forEach((method) => {
      switch (method.methodKind) {
        case MethodKind.Unary:
          {
            f.print(f.jsDoc(method));
            f.print(f.exportDecl("const", safeIdentifier(localName(method))), ": {");
            f.print("      readonly name: ", f.string(method.name), ",");
            f.print("      readonly I: typeof ", method.input, ",");
            f.print("      readonly O: typeof ", method.output, ",");
            f.print("      readonly kind: ", rtMethodKind, ".", MethodKind[method.methodKind], ",");
            if (method.idempotency !== undefined) {
              f.print("      readonly idempotency: ", rtMethodIdempotency, ".", MethodIdempotency[method.idempotency], ",");
            }
            f.print("  readonly service: {");
            f.print("    readonly typeName: ", f.string(service.typeName));
            f.print("  }");
            f.print("};")
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
