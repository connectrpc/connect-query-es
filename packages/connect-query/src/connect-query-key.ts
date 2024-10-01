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

import type {
  DescMessage,
  MessageInitShape,
  // MessageShape,
} from "@bufbuild/protobuf";
import { create } from "@bufbuild/protobuf";
import type { SkipToken } from "@tanstack/react-query";
import { skipToken } from "@tanstack/react-query";

import type { MethodUnaryDescriptor } from "./method-unary-descriptor.js";

/**
 * TanStack Query requires query keys in order to decide when the query should automatically update.
 *
 * `QueryKey`s in TanStack Query are usually arbitrary, but Connect-Query uses the approach of creating a query key that begins with the least specific information: the service's `typeName`, followed by the method name, and ending with the most specific information to identify a particular request: the input message itself.
 *
 * For example, for a query key might look like this:
 *
 * @example
 * [
 *   "connectrpc.eliza.v1.ElizaService",
 *   "Say",
 *   { sentence: "hello there" },
 * ]
 */
export type ConnectQueryKey<I extends DescMessage> = [
  serviceTypeName: string,
  methodName: string,
  // input: MessageShape<I>,
  input: Record<string, unknown>,
];

/**
 * TanStack Query requires query keys in order to decide when the query should automatically update.
 *
 * In Connect-Query, much of this is handled automatically by this function.
 *
 * @see ConnectQueryKey for information on the components of Connect-Query's keys.
 */
export function createConnectQueryKey<
  I extends DescMessage,
  O extends DescMessage,
>(
  schema: Pick<MethodUnaryDescriptor<I, O>, "input" | "parent" | "name">,
  input?: SkipToken | MessageInitShape<I> | undefined
): ConnectQueryKey<I> {
  const message = create(
    schema.input,
    input === disableQuery || !input ? undefined : input
  );
  return [
    schema.parent.typeName,
    schema.name,
    create(schema.input, input === skipToken || !input ? undefined : input),
  ];
}

/**
 * Similar to @see ConnectQueryKey, but for infinite queries.
 */
export type ConnectInfiniteQueryKey<I extends DescMessage> = [
  serviceTypeName: string,
  methodName: string,
  // input: MessageShape<I>,
  input: Record<string, unknown>,
  "infinite",
];

/**
 * Similar to @see createConnectQueryKey, but for infinite queries.
 */
export function createConnectInfiniteQueryKey<
  I extends DescMessage,
  O extends DescMessage,
>(
  schema: Pick<MethodUnaryDescriptor<I, O>, "input" | "parent" | "name">,
  input?: SkipToken | MessageInitShape<I> | undefined
): ConnectInfiniteQueryKey<I> {
  return [...createConnectQueryKey(schema, input), "infinite"];
}
