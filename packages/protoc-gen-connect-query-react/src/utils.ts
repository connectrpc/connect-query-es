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

import type { DescMethod } from '@bufbuild/protobuf';
import { codegenInfo } from '@bufbuild/protobuf';
import type { createEcmaScriptPlugin, Schema } from '@bufbuild/protoplugin';

/**
 * Extracts the type of PluginInit from @bufbuild/protoplugin
 */
export type PluginInit = Required<Parameters<typeof createEcmaScriptPlugin>[0]>;

/**
 * Return a safe identifier for a React hook for the given RPC.
 */
export function reactHookName(
  method: DescMethod,
  kind: 'InfiniteQuery' | 'Mutation' | 'Query',
) {
  const protoRpcName = method.proto.name ?? /* istanbul ignore next */ '';
  // By convention, RPC names start with uppercase, but for good measure, we make sure
  const rpcNameUpperCase =
    protoRpcName.charAt(0).toUpperCase() + protoRpcName.slice(1);
  const hookName = `use${rpcNameUpperCase}${kind}`;
  return codegenInfo.safeIdentifier(hookName);
}

/**
 * Parses the plugin option "import-hook-from" from the code generator request.
 * Returns the default value if not present.
 */
export function getImportHookFromOption(schema: Schema): string {
  const parameter = schema.proto.parameter
    ?.split(',')
    .reduce<Record<string, string>>((acc, curr) => {
      const [key, value] = curr.split('=');
      acc = Object.assign(acc, { [key]: value });
      return acc;
    }, {});
  if (parameter && 'import-hook-from' in parameter) {
    return parameter['import-hook-from'];
  }
  return '@tanstack/react-query';
}
