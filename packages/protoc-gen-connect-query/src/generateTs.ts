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

    const { MethodKind: rtMethodKind, MethodIdempotency: rtMethodIdempotency } =
      schema.runtime;

    service.methods
      .filter((method) => method.methodKind === MethodKind.Unary)
      .forEach((method, index, filteredMethods) => {
        f.print(f.jsDoc(method));
        f.print(f.exportDecl("const", safeIdentifier(localName(method))), " = {");
        f.print("  localName: ",f.string(localName(method)), ",");
        f.print("  name: ", f.string(method.name), ",");
        f.print("  kind: ", rtMethodKind, ".", MethodKind[method.methodKind], ",");
        f.print("  I: ", method.input, ",");
        f.print("  O: ", method.output, ",");
        if (method.idempotency !== undefined) {
          f.print("      idempotency: ", rtMethodIdempotency, ".", MethodIdempotency[method.idempotency], ",");
        }
        f.print("  service: {");
        f.print("    typeName: ", f.string(service.typeName));
        f.print("  }");
        f.print("}", isTs ? " as const" : "", ";");

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
