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

import {
  type Message,
  type PartialMessage,
  type PlainMessage,
  toPlainMessage,
} from "@bufbuild/protobuf";

import type { MethodUnaryDescriptor } from "./method-unary-descriptor.js";
import type { DisableQuery } from "./utils.js";
import { disableQuery } from "./utils.js";

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
export type ConnectQueryKey<I extends Message<I>> = [
  serviceTypeName: string,
  methodName: string,
  input: PlainMessage<I>,
];

/**
 * TanStack Query requires query keys in order to decide when the query should automatically update.
 *
 * In Connect-Query, much of this is handled automatically by this function.
 *
 * @see ConnectQueryKey for information on the components of Connect-Query's keys.
 */
export function createConnectQueryKey<
  I extends Message<I>,
  O extends Message<O>,
>(
  methodDescriptor: Pick<MethodUnaryDescriptor<I, O>, "I" | "name" | "service">,
  input?: DisableQuery | PartialMessage<I> | undefined,
): ConnectQueryKey<I> {
  return [
    methodDescriptor.service.typeName,
    methodDescriptor.name,
    input === disableQuery || !input
      ? toPlainMessage(new methodDescriptor.I({}))
      : toPlainMessage(new methodDescriptor.I(input)),
  ];
}

/**
 * Similar to @see ConnectQueryKey, but for infinite queries.
 */
export type ConnectInfiniteQueryKey<I extends Message<I>> = [
  serviceTypeName: string,
  methodName: string,
  input: PlainMessage<I>,
  "infinite",
];

/**
 * Similar to @see createConnectQueryKey, but for infinite queries.
 */
export function createConnectInfiniteQueryKey<
  I extends Message<I>,
  O extends Message<O>,
>(
  methodDescriptor: Pick<MethodUnaryDescriptor<I, O>, "I" | "name" | "service">,
  input?: DisableQuery | PartialMessage<I> | undefined,
): ConnectInfiniteQueryKey<I> {
  return [...createConnectQueryKey(methodDescriptor, input), "infinite"];
}
