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
  MessageShape,
} from "@bufbuild/protobuf";
import type { CallOptions, ConnectError, Transport } from "@connectrpc/connect";
import type {
  GetNextPageParamFunction,
  InfiniteData,
  QueryFunction,
  SkipToken,
  UseInfiniteQueryOptions,
  UseQueryOptions,
  UseSuspenseInfiniteQueryOptions,
} from "@tanstack/react-query";
import { skipToken } from "@tanstack/react-query";

import { callUnaryMethod } from "./call-unary-method.js";
import {
  type ConnectInfiniteQueryKey,
  createConnectInfiniteQueryKey,
} from "./connect-query-key.js";
import type { MethodUnaryDescriptor } from "./method-unary-descriptor.js";
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
  /** Transport can be overridden here.*/
  transport: Transport;
  /** Additional call options */
  callOptions?: Omit<CallOptions, "signal"> | undefined;
  /** Determines the next page. */
  getNextPageParam: GetNextPageParamFunction<
    MessageInitShape<I>[ParamKey],
    MessageShape<O>
  >;
}

/**
 * Options for useInfiniteQuery
 */
export type CreateInfiniteQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends keyof MessageInitShape<I>,
> = ConnectInfiniteQueryOptions<I, O, ParamKey> &
  Omit<
    UseInfiniteQueryOptions<
      MessageShape<O>,
      ConnectError,
      InfiniteData<MessageShape<O>>,
      MessageShape<O>,
      ConnectInfiniteQueryKey<I>,
      MessageInitShape<I>[ParamKey]
    >,
    "getNextPageParam" | "initialPageParam" | "queryFn" | "queryKey"
  >;

/**
 * Options for useSuspenseInfiniteQuery
 */
export type CreateSuspenseInfiniteQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends keyof MessageInitShape<I>,
> = ConnectInfiniteQueryOptions<I, O, ParamKey> &
  Omit<
    UseSuspenseInfiniteQueryOptions<
      MessageShape<O>,
      ConnectError,
      InfiniteData<MessageShape<O>>,
      MessageShape<O>,
      ConnectInfiniteQueryKey<I>,
      MessageInitShape<I>[ParamKey]
    >,
    "getNextPageParam" | "initialPageParam" | "queryFn" | "queryKey"
  >;

function createUnaryInfiniteQueryFn<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends keyof MessageInitShape<I>,
>(
  schema: MethodUnaryDescriptor<I, O>,
  input: MessageInitShape<I>,
  {
    callOptions,
    transport,
    pageParamKey,
  }: {
    transport: Transport;
    callOptions?: CallOptions | undefined;
    pageParamKey: ParamKey;
  },
): QueryFunction<
  MessageShape<O>,
  ConnectInfiniteQueryKey<I>,
  MessageInitShape<I>[ParamKey]
> {
  return async (context) => {
    assert("pageParam" in context, "pageParam must be part of context");

    const inputCombinedWithPageParam = {
      ...input,
      [pageParamKey]: context.pageParam,
    };
    return callUnaryMethod(schema, inputCombinedWithPageParam, {
      callOptions: {
        ...callOptions,
        signal: callOptions?.signal ?? context.signal,
      },
      transport,
    });
  };
}

/**
 * Query the method provided. Maps to useInfiniteQuery on tanstack/react-query
 */
export function createUseInfiniteQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends keyof MessageInitShape<I>,
>(
  schema: MethodUnaryDescriptor<I, O>,
  input:
    | SkipToken
    | (MessageInitShape<I> & Required<Pick<MessageInitShape<I>, ParamKey>>),
  {
    transport,
    getNextPageParam,
    pageParamKey,
    callOptions,
  }: ConnectInfiniteQueryOptions<I, O, ParamKey>,
): {
  getNextPageParam: ConnectInfiniteQueryOptions<
    I,
    O,
    ParamKey
  >["getNextPageParam"];
  queryKey: ConnectInfiniteQueryKey<I>;
  queryFn:
    | QueryFunction<
        MessageShape<O>,
        ConnectInfiniteQueryKey<I>,
        MessageInitShape<I>[ParamKey]
      >
    | SkipToken;
  structuralSharing: Exclude<UseQueryOptions["structuralSharing"], undefined>;
  initialPageParam: MessageInitShape<I>[ParamKey];
} {
  const queryKey = createConnectInfiniteQueryKey(
    schema,
    input === skipToken
      ? undefined
      : {
          ...input,
          [pageParamKey]: undefined,
        },
  );
  const structuralSharing = createStructuralSharing(schema.output);
  const queryFn =
    input === skipToken
      ? skipToken
      : createUnaryInfiniteQueryFn(schema, input, {
          transport,
          callOptions,
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
