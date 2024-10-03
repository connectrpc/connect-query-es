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

import type { Transport } from "@connectrpc/connect";

const transportKeys = new WeakMap<Transport, string>();
let counter = 0;

/**
 * For a given Transport, create a string key that is suitable for a Query Key
 * in TanStack Query.
 *
 * This function will return a unique string for every reference.
 */
export function createTransportKey(transport: Transport): string {
  let key = transportKeys.get(transport);
  if (key === undefined) {
    key = `t${++counter}`;
    transportKeys.set(transport, key);
  }
  return key;
}
