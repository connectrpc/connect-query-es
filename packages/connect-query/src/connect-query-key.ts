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
  DescMethod,
  DescService,
  MessageInitShape,
} from "@bufbuild/protobuf";
import type { Transport } from "@connectrpc/connect";
import type { SkipToken } from "@tanstack/react-query";

import { createMessageKey } from "./message-key.js";
import { createTransportKey } from "./transport-key.js";

/**
 * TanStack Query requires query keys in order to decide when the query should automatically update.
 *
 *
 * TODO
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
export type ConnectQueryKey = [
  "connect-query",
  {
    /**
     * A key for a Transport reference, created with createTransportKey().
     */
    transport?: string;
    /**
     * The name of the service, e.g. connectrpc.eliza.v1.ElizaService
     */
    serviceName: string;
    /**
     * The name of the method, e.g. Say.
     */
    methodName?: string;
    /**
     * Whether this is an infinite query, or a regular one.
     */
    cardinality?: "infinite" | "finite";
    /**
     * A key for the request message, created with createMessageKey(),
     * or "skipped".
     */
    input?: Record<string, unknown> | "skipped";
  },
];

type KeyParams<Desc extends DescMethod | DescService> = Desc extends DescMethod
  ? {
      /**
       * Set `serviceName` and `methodName` in the key.
       */
      method: Desc;
      /**
       * Set `input` in the key:
       * - If a SkipToken is provided, `input` is "skipped".
       * - If an init shape is provided, `input` is set to a message key.
       * - If omitted or undefined, `input` is not set in the key.
       */
      input?: MessageInitShape<Desc["input"]> | SkipToken | undefined;
      /**
       * Set `transport` in the key.
       */
      transport?: Transport;
      /**
       * Set `cardinality` in the key - "finite" by default.
       */
      cardinality?: "finite" | "infinite" | "any";
      /**
       * If omit the field with this name from the key for infinite queries.
       */
      pageParamKey?: keyof MessageInitShape<Desc["input"]>;
    }
  : {
      /**
       * Set `serviceName` in the key, and omit `methodName`.
       */
      service: Desc;
      /**
       * Set `transport` in the key.
       */
      transport?: Transport;
      /**
       * Set `cardinality` in the key - "finite" by default.
       */
      cardinality?: "finite" | "infinite" | "any";
    };

/**
 * TanStack Query requires query keys in order to decide when the query should automatically update.
 *
 * In Connect-Query, much of this is handled automatically by this function.
 *
 * @see ConnectQueryKey for information on the components of Connect-Query's keys.
 */
export function createConnectQueryKey<Desc extends DescMethod | DescService>(
  params: KeyParams<Desc>,
): ConnectQueryKey {
  const props: ConnectQueryKey[1] =
    "method" in params
      ? {
          serviceName: params.method.parent.typeName,
          methodName: params.method.name,
        }
      : {
          serviceName: params.service.typeName,
        };
  if (params.transport !== undefined) {
    props.transport = createTransportKey(params.transport);
  }
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- "Cases not matched: undefined" 🤷
  switch (params.cardinality) {
    case undefined:
    case "finite":
      props.cardinality = "finite";
      break;
    case "infinite":
      props.cardinality = "infinite";
      break;
    case "any":
      break;
  }
  if ("method" in params && typeof params.input == "symbol") {
    props.input = "skipped";
  }
  if ("method" in params) {
    if (typeof params.input == "symbol") {
      props.input = "skipped";
    } else if (params.input !== undefined) {
      props.input = createMessageKey(
        params.method.input,
        params.input,
        params.pageParamKey,
      );
    }
  }
  return ["connect-query", props];
}
