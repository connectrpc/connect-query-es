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

import { type DescMessage, equals, isMessage } from "@bufbuild/protobuf";
import { replaceEqualDeep } from "@tanstack/query-core";

/**
 * Returns a simplistic implementation for "structural sharing" for a Protobuf
 * message.
 *
 * To keep references intact between re-renders, we return the old version if it
 * equals the new version.
 *
 * See https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations#structural-sharing
 */
export function createStructuralSharing(
  schema: DescMessage,
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- matching the @tanstack/react-query types
): (oldData: unknown | undefined, newData: unknown) => unknown {
  return function (oldData, newData) {
    if (!isMessage(oldData) || !isMessage(newData)) {
      return replaceEqualDeep(oldData, newData);
    }
    if (!equals(schema, oldData, newData)) {
      return newData;
    }
    return oldData;
  };
}
