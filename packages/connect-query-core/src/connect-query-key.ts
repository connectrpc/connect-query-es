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
  DescMethod,
  DescMethodUnary,
  DescService,
  MessageInitShape,
} from "@bufbuild/protobuf";
import type { Transport } from "@connectrpc/connect";
import type { SkipToken } from "@tanstack/query-core";

import { createMessageKey } from "./message-key.js";
import { createTransportKey } from "./transport-key.js";

/**
 * TanStack Query manages query caching for you based on query keys. `QueryKey`s in TanStack Query are arrays with arbitrary JSON-serializable data - typically handwritten for each endpoint.
 *
 * In Connect Query, query keys are more structured, since queries are always tied to a service, RPC, input message, and transport. For example, for a query key might look like this:
 *
 * @example
 * [
 *   "connect-query",
 *   {
 *     transport: "t1",
 *     serviceName: "connectrpc.eliza.v1.ElizaService",
 *     methodName: "Say",
 *     input: {
 *       sentence: "hello there",
 *     },
 *     cardinality: "finite",
 *   }
 * ]
 */
export type ConnectQueryKey = [
  /**
   * To distinguish Connect query keys from other query keys, they always start with the string "connect-query".
   */
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
     * A key for the request message, created with createMessageKey(),
     * or "skipped".
     */
    input?: Record<string, unknown> | "skipped";
    /**
     * Whether this is an infinite query, or a regular one.
     */
    cardinality?: "infinite" | "finite" | undefined;
  },
];

type KeyParamsForMethod<Desc extends DescMethod> = {
  /**
   * Set `serviceName` and `methodName` in the key.
   */
  schema: Desc;
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
   * Set `cardinality` in the key - undefined is used for filters to match both finite and infinite queries.
   */
  cardinality: "finite" | "infinite" | undefined;
  /**
   * If omit the field with this name from the key for infinite queries.
   */
  pageParamKey?: keyof MessageInitShape<Desc["input"]>;
};

type KeyParamsForService<Desc extends DescService> = {
  /**
   * Set `serviceName` in the key, and omit `methodName`.
   */
  schema: Desc;
  /**
   * Set `transport` in the key.
   */
  transport?: Transport;
  /**
   * Set `cardinality` in the key - undefined is used for filters to match both finite and infinite queries.
   */
  cardinality: "finite" | "infinite" | undefined;
};

/**
 * TanStack Query manages query caching for you based on query keys. In Connect Query, keys are structured, and can easily be created using this factory function.
 *
 * When you make a query, a unique key is automatically created from the schema, input message, and transport. For example:
 *
 * ```ts
 * import { useQuery } from "@connectrpc/connect-query";
 *
 * useQuery(ElizaService.method.say, { sentence: "hello" });
 *
 * // creates the key:
 * [
 *   "connect-query",
 *   {
 *     transport: "t1",
 *     serviceName: "connectrpc.eliza.v1.ElizaService",
 *     methodName: "Say",
 *     input: { sentence: "hello" },
 *     cardinality: "finite",
 *   }
 * ]
 * ```
 *
 * The same key can be created manually with this factory:
 *
 * ```ts
 * createConnectQueryKey({
 *   transport: myTransportReference,
 *   schema: ElizaService.method.say,
 *   input: { sentence: "hello" }
 * });
 * ```
 *
 * Note that the factory allows to create partial keys that can be used to filter queries. For example, you can create a key without a transport, any cardinality, any input message, or with a partial input message.
 *
 * @see ConnectQueryKey for information on the components of Connect-Query's keys.
 */
export function createConnectQueryKey<
  I extends DescMessage,
  O extends DescMessage,
  Desc extends DescService,
>(
  params: KeyParamsForMethod<DescMethodUnary<I, O>> | KeyParamsForService<Desc>,
): ConnectQueryKey {
  const props: ConnectQueryKey[1] =
    params.schema.kind == "rpc"
      ? {
          serviceName: params.schema.parent.typeName,
          methodName: params.schema.name,
        }
      : {
          serviceName: params.schema.typeName,
        };
  if (params.transport !== undefined) {
    props.transport = createTransportKey(params.transport);
  }
  if (params.cardinality !== undefined) {
    props.cardinality = params.cardinality;
  }
  if (params.schema.kind == "rpc" && "input" in params) {
    if (typeof params.input == "symbol") {
      props.input = "skipped";
    } else if (params.input !== undefined) {
      props.input = createMessageKey(
        params.schema.input,
        params.input,
        params.pageParamKey,
      );
    }
  }
  return ["connect-query", props];
}
