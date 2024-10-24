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
  DescMethodUnary,
  MessageInitShape,
  MessageShape,
} from "@bufbuild/protobuf";
import type { Transport } from "@connectrpc/connect";
import type {
  GetNextPageParamFunction,
  QueryFunction,
  SkipToken,
} from "@tanstack/query-core";
import { skipToken } from "@tanstack/query-core";

import { callUnaryMethod } from "./call-unary-method.js";
import {
  type ConnectQueryKey,
  createConnectQueryKey,
} from "./connect-query-key.js";
import { createStructuralSharing } from "./structural-sharing.js";
import { assert } from "./utils.js";

/**
 * Options specific to connect-query
 */
export interface ConnectInfiniteQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends keyof MessageInitShape<I>,
> {
  /** Defines which part of the input should be considered the page param */
  pageParamKey: ParamKey;
  /** Determines the next page. */
  getNextPageParam: GetNextPageParamFunction<
    MessageInitShape<I>[ParamKey],
    MessageShape<O>
  >;
}

// eslint-disable-next-line @typescript-eslint/max-params -- we have 4 required arguments
function createUnaryInfiniteQueryFn<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends keyof MessageInitShape<I>,
>(
  transport: Transport,
  schema: DescMethodUnary<I, O>,
  input: MessageInitShape<I>,
  {
    pageParamKey,
  }: {
    pageParamKey: ParamKey;
  },
): QueryFunction<
  MessageShape<O>,
  ConnectQueryKey,
  MessageInitShape<I>[ParamKey]
> {
  return async (context) => {
    assert("pageParam" in context, "pageParam must be part of context");

    const inputCombinedWithPageParam = {
      ...input,
      [pageParamKey]: context.pageParam,
    };
    return callUnaryMethod(transport, schema, inputCombinedWithPageParam, {
      signal: context.signal,
    });
  };
}

/**
 * Query the method provided. Maps to useInfiniteQuery on tanstack/react-query
 */
export function createInfiniteQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends keyof MessageInitShape<I>,
>(
  schema: DescMethodUnary<I, O>,
  input:
    | SkipToken
    | (MessageInitShape<I> & Required<Pick<MessageInitShape<I>, ParamKey>>),
  {
    transport,
    getNextPageParam,
    pageParamKey,
  }: ConnectInfiniteQueryOptions<I, O, ParamKey> & { transport: Transport },
): {
  getNextPageParam: ConnectInfiniteQueryOptions<
    I,
    O,
    ParamKey
  >["getNextPageParam"];
  queryKey: ConnectQueryKey;
  queryFn:
    | QueryFunction<
        MessageShape<O>,
        ConnectQueryKey,
        MessageInitShape<I>[ParamKey]
      >
    | SkipToken;
  structuralSharing: (oldData: unknown, newData: unknown) => unknown;
  initialPageParam: MessageInitShape<I>[ParamKey];
} {
  const queryKey = createConnectQueryKey({
    cardinality: "infinite",
    schema,
    transport,
    input,
  });
  const structuralSharing = createStructuralSharing(schema.output);
  const queryFn =
    input === skipToken
      ? skipToken
      : createUnaryInfiniteQueryFn(transport, schema, input, {
          pageParamKey,
        });
  return {
    getNextPageParam,
    initialPageParam:
      input === skipToken
        ? (undefined as MessageInitShape<I>[ParamKey])
        : (input[pageParamKey] as MessageInitShape<I>[ParamKey]),
    queryKey,
    queryFn,
    structuralSharing,
  };
}
