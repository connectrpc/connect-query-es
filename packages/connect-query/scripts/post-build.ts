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

import { writeFileSync } from 'fs';

import packageJson from '../package.json';

const { version, name } = packageJson;

const data = {
  _: 'this package.json file exists to make sure that Node knows to interpret the `.js` files in this directory as CommonJS and not as ESM, which it will do by default for files ending with `.js` unless the `type` field set to `commonjs`',
  type: 'commonjs',
  version,
  name,
};

writeFileSync('./dist/cjs/package.json', JSON.stringify(data, null, 2));
