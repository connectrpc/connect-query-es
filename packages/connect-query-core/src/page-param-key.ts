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

import type { Message } from "@bufbuild/protobuf";

type StringKeyOf<T> = Exclude<Extract<keyof T, string>, keyof Message>;
type PrevDepth = [never, 0, 1, 2, 3, 4, 5];

type CanDescend<T> = T extends readonly unknown[]
  ? false
  : T extends object
    ? true
    : false;

type MessagePageParamPathString<T, Depth extends number = 5> = Depth extends 0
  ? never
  : T extends object
    ? {
        [K in StringKeyOf<T>]: CanDescend<NonNullable<T[K]>> extends true
          ?
              | K
              | `${K}.${MessagePageParamPathString<
                  NonNullable<T[K]>,
                  PrevDepth[Depth]
                >}`
          : K;
      }[StringKeyOf<T>]
    : never;

/**
 * A page param key can be a root key,
 * or a dot-separated key path.
 */
export type MessagePageParamKey<T> = MessagePageParamPathString<T>;

type DotPathValue<T, P extends string> = P extends `${infer Head}.${infer Tail}`
  ? Head extends StringKeyOf<T>
    ? DotPathValue<NonNullable<T[Head]>, Tail>
    : never
  : P extends StringKeyOf<T>
    ? T[P]
    : never;

/**
 * Resolves the value type at a page param key path.
 */
export type MessagePageParamValue<
  T,
  K extends MessagePageParamKey<T>,
> = K extends string ? DotPathValue<T, K> : never;

type RootKey<K> = K extends `${infer Head}.${string}`
  ? Head
  : K extends StringKeyOf<Record<string, unknown>>
    ? K
    : never;

/**
 * Requires the root object key for a page param path.
 */
export type MessageInitWithPageParam<T, K extends MessagePageParamKey<T>> = T &
  Required<Pick<T, Extract<RootKey<K>, StringKeyOf<T>>>>;

export function pageParamPathSegments(
  pageParamKey: MessagePageParamKey<Record<string, unknown>>,
): string[] {
  return pageParamKey.split(".");
}

export function getValueAtPath(
  value: Record<string, unknown>,
  pageParamKey: MessagePageParamKey<Record<string, unknown>>,
): unknown {
  const path = pageParamPathSegments(pageParamKey);
  let current: unknown = value;
  for (const segment of path) {
    if (
      typeof current !== "object" ||
      current === null ||
      !(segment in current)
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

export function setValueAtPath(
  value: Record<string, unknown>,
  pageParamKey: MessagePageParamKey<Record<string, unknown>>,
  pageParam: unknown,
): Record<string, unknown> {
  const path = pageParamPathSegments(pageParamKey);
  const result: Record<string, unknown> = { ...value };
  let source: Record<string, unknown> = value;
  let target = result;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const sourceNext = source[key];
    const targetNext =
      typeof sourceNext === "object" && sourceNext !== null
        ? { ...(sourceNext as Record<string, unknown>) }
        : {};
    target[key] = targetNext;
    target = targetNext;
    source =
      typeof sourceNext === "object" && sourceNext !== null
        ? (sourceNext as Record<string, unknown>)
        : {};
  }
  target[path[path.length - 1]] = pageParam;
  return result;
}
