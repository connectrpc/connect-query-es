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

import { createEcmaScriptPlugin } from '@bufbuild/protoplugin';

import { version } from '../package.json';
import { generateTs } from './generateTs';

export const protocGenConnectQueryWithHooks = createEcmaScriptPlugin({
  name: 'protoc-gen-connect-query-with-hooks',
  version: `v${String(version)}`,
  generateTs,

  // The generated TypeScript output is completely valid JavaScript since all the types are inferred
  generateJs: generateTs,

  parseOption: (key, value) => {
    if (key === 'import-hook-from') {
      return {
        [key]: value,
      };
    }
    return undefined;
  },
});