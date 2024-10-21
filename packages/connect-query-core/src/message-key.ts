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

import type { DescMessage, MessageInitShape } from "@bufbuild/protobuf";
import { create } from "@bufbuild/protobuf";
import type {
  ReflectList,
  ReflectMap,
  ReflectMessage,
} from "@bufbuild/protobuf/reflect";
import { reflect } from "@bufbuild/protobuf/reflect";
import { base64Encode } from "@bufbuild/protobuf/wire";

/**
 * For any given message, create an object that is suitable for a Query Key in
 * TanStack Query:
 *
 * - Default values are omitted (both implicit and explicit field presence).
 * - NaN, Infinity, and -Infinity are converted to a string.
 * - Uint8Array is encoded to a string with Base64.
 * - BigInt values are converted to a string.
 * - Properties are sorted by Protobuf source order.
 * - Map keys are sorted with Array.sort.
 *
 * If pageParamKey is provided, omit the field with this name from the key.
 */
export function createMessageKey<
  Desc extends DescMessage,
  PageParamKey extends keyof MessageInitShape<Desc>,
>(
  schema: Desc,
  value: MessageInitShape<Desc>,
  pageParamKey?: PageParamKey,
): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define -- circular reference
  return messageKey(
    reflect(schema, create(schema, value)),
    pageParamKey?.toString(),
  );
}

function scalarKey(value: unknown): unknown {
  if (typeof value == "bigint") {
    return String(value);
  }
  if (typeof value == "number" && !isFinite(value)) {
    return String(value);
  }
  if (value instanceof Uint8Array) {
    return base64Encode(value, "std_raw");
  }
  return value;
}

function listKey(list: ReflectList): unknown[] {
  const arr = Array.from(list);
  const { listKind } = list.field();
  if (listKind == "scalar") {
    return arr.map(scalarKey);
  }
  if (listKind == "message") {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define -- circular reference
    return (arr as ReflectMessage[]).map((m) => messageKey(m));
  }
  return arr;
}

function mapKey(map: ReflectMap): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/require-array-sort-compare -- we want the standard behavior
  return Array.from(map.keys())
    .sort()
    .reduce<Record<string, unknown>>((result, k) => {
      switch (map.field().mapKind) {
        case "message":
          // eslint-disable-next-line @typescript-eslint/no-use-before-define -- circular reference
          result[k as string] = messageKey(map.get(k) as ReflectMessage);
          break;
        case "scalar":
          result[k as string] = scalarKey(map.get(k));
          break;
        case "enum":
          result[k as string] = map.get(k);
          break;
      }
      return result;
    }, {});
}

function messageKey(
  message: ReflectMessage,
  pageParamKey?: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const f of message.sortedFields) {
    if (!message.isSet(f)) {
      continue;
    }
    if (f.localName === pageParamKey) {
      continue;
    }
    switch (f.fieldKind) {
      case "scalar":
        result[f.localName] = scalarKey(message.get(f));
        break;
      case "enum":
        result[f.localName] = message.get(f);
        break;
      case "list":
        result[f.localName] = listKey(message.get(f));
        break;
      case "map":
        result[f.localName] = mapKey(message.get(f));
        break;
      case "message":
        result[f.localName] = messageKey(message.get(f));
        break;
    }
  }
  return result;
}
