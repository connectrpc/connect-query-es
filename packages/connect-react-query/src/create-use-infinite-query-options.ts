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

import type { Message, PartialMessage } from "@bufbuild/protobuf";
import type { CallOptions, ConnectError, Transport } from "@connectrpc/connect";
import type {
  GetNextPageParamFunction,
  InfiniteData,
  QueryFunction,
  UseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryOptions,
} from "@tanstack/react-query";

import {
  type ConnectQueryKey,
  createConnectQueryKey,
} from "./connect-query-key";
import type { MethodUnaryDescriptor } from "./method-unary-descriptor";
import { assert, type DisableQuery, disableQuery } from "./utils";

/**
 * Options specific to connect-query
 */
export interface ConnectInfiniteQueryOptions<
  I extends Message<I>,
  O extends Message<O>,
  ParamKey extends keyof PartialMessage<I>,
> {
  /** Defines which part of the input should be considered the page param */
  pageParamKey: ParamKey;
  /** Transport can be overridden here.*/
  transport: Transport;
  /** Additional call options */
  callOptions?: Omit<CallOptions, "signal"> | undefined;
  /** Determines the next page. */
  getNextPageParam: GetNextPageParamFunction<PartialMessage<I>[ParamKey], O>;
}

/**
 * Options for useInfiniteQuery
 */
export type CreateInfiniteQueryOptions<
  I extends Message<I>,
  O extends Message<O>,
  ParamKey extends keyof PartialMessage<I>,
> = ConnectInfiniteQueryOptions<I, O, ParamKey> &
  Omit<
    UseInfiniteQueryOptions<
      O,
      ConnectError,
      InfiniteData<O>,
      O,
      ConnectQueryKey<I>,
      PartialMessage<I>[ParamKey]
    >,
    "getNextPageParam" | "initialPageParam" | "queryFn" | "queryKey"
  >;

/**
 * Options for useSuspenseInfiniteQuery
 */
export type CreateSuspenseInfiniteQueryOptions<
  I extends Message<I>,
  O extends Message<O>,
  ParamKey extends keyof PartialMessage<I>,
> = ConnectInfiniteQueryOptions<I, O, ParamKey> &
  Omit<
    UseSuspenseInfiniteQueryOptions<
      O,
      ConnectError,
      InfiniteData<O>,
      O,
      ConnectQueryKey<I>,
      PartialMessage<I>[ParamKey]
    >,
    "getNextPageParam" | "initialPageParam" | "queryFn" | "queryKey"
  >;

function createUnaryInfiniteQueryFn<
  I extends Message<I>,
  O extends Message<O>,
  ParamKey extends keyof PartialMessage<I>,
>(
  methodType: MethodUnaryDescriptor<I, O>,
  input: DisableQuery | PartialMessage<I>,
  {
    callOptions,
    transport,
    pageParamKey,
  }: {
    transport: Transport;
    callOptions?: CallOptions | undefined;
    pageParamKey: ParamKey;
  },
): QueryFunction<O, ConnectQueryKey<I>, PartialMessage<I>[ParamKey]> {
  return async (context) => {
    assert(input !== disableQuery, "Disabled query cannot be fetched");
    assert("pageParam" in context, "pageParam must be part of context");

    const inputCombinedWithPageParam = {
      ...input,
      [pageParamKey]: context.pageParam,
    };
    const result = await transport.unary(
      { typeName: methodType.service.typeName, methods: {} },
      methodType,
      (callOptions ?? context).signal,
      callOptions?.timeoutMs,
      callOptions?.headers,
      inputCombinedWithPageParam,
    );
    return result.message;
  };
}

/**
 * Query the method provided. Maps to useInfiniteQuery on tanstack/react-query
 *
 * @param methodSig
 * @returns
 */
export function createUseSuspenseInfiniteQueryOptions<
  I extends Message<I>,
  O extends Message<O>,
  ParamKey extends keyof PartialMessage<I>,
  Input extends PartialMessage<I> & Required<Pick<PartialMessage<I>, ParamKey>>,
>(
  methodSig: MethodUnaryDescriptor<I, O>,
  input: Input,
  {
    transport,
    getNextPageParam,
    pageParamKey,
    callOptions,
    ...queryOptions
  }: CreateInfiniteQueryOptions<I, O, ParamKey>,
): Omit<
  CreateInfiniteQueryOptions<I, O, ParamKey>,
  "callOptions" | "pageParamKey" | "transport"
> & {
  queryKey: ConnectQueryKey<I>;
  queryFn: QueryFunction<O, ConnectQueryKey<I>, PartialMessage<I>[ParamKey]>;
  initialPageParam: PartialMessage<I>[ParamKey];
} {
  const queryKey = createConnectQueryKey(methodSig, {
    ...input,
    [pageParamKey]: undefined,
  });
  return {
    ...queryOptions,
    getNextPageParam,
    initialPageParam: input[pageParamKey] as PartialMessage<I>[ParamKey],
    queryKey,
    queryFn: createUnaryInfiniteQueryFn(methodSig, input, {
      transport,
      callOptions,
      pageParamKey,
    }),
  };
}

/**
 * Query the method provided. Maps to useInfiniteQuery on tanstack/react-query
 *
 * @param methodSig
 * @returns
 */
export function createUseInfiniteQueryOptions<
  I extends Message<I>,
  O extends Message<O>,
  ParamKey extends keyof PartialMessage<I>,
  Input extends PartialMessage<I> & Required<Pick<PartialMessage<I>, ParamKey>>,
>(
  methodSig: MethodUnaryDescriptor<I, O>,
  input: DisableQuery | Input,
  { pageParamKey, ...queryOptions }: CreateInfiniteQueryOptions<I, O, ParamKey>,
): Omit<
  CreateInfiniteQueryOptions<I, O, ParamKey>,
  "callOptions" | "pageParamKey" | "transport"
> & {
  queryKey: ConnectQueryKey<I>;
  queryFn: QueryFunction<O, ConnectQueryKey<I>, PartialMessage<I>[ParamKey]>;
  initialPageParam: PartialMessage<I>[ParamKey];
  enabled: boolean;
} {
  const enabled = input !== disableQuery && queryOptions.enabled !== false;

  return {
    ...createUseSuspenseInfiniteQueryOptions<I, O, ParamKey, Input>(
      methodSig,
      input === disableQuery ? ({} as Input) : input,
      {
        pageParamKey,
        ...queryOptions,
      },
    ),
    enabled,
  };
}
