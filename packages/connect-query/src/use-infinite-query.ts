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
import type { ConnectError, Transport } from "@connectrpc/connect";
import type {
  InfiniteData,
  SkipToken,
  UseInfiniteQueryOptions as TanStackUseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseSuspenseInfiniteQueryOptions as TanStackUseSuspenseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryResult,
} from "@tanstack/react-query";
import {
  useInfiniteQuery as tsUseInfiniteQuery,
  useSuspenseInfiniteQuery as tsUseSuspenseInfiniteQuery,
} from "@tanstack/react-query";

import type { ConnectInfiniteQueryKey } from "./connect-query-key.js";
import type { ConnectInfiniteQueryOptions } from "./create-infinite-query-options.js";
import { createInfiniteQueryOptions } from "./create-infinite-query-options.js";
import type { MethodUnaryDescriptor } from "./method-unary-descriptor.js";
import { useTransport } from "./use-transport.js";

/**
 * Options for useInfiniteQuery
 */
export type UseInfiniteQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends keyof MessageInitShape<I>,
> = Omit<
  TanStackUseInfiniteQueryOptions<
    MessageShape<O>,
    ConnectError,
    InfiniteData<MessageShape<O>>,
    MessageShape<O>,
    ConnectInfiniteQueryKey<I>,
    MessageInitShape<I>[ParamKey]
  >,
  "getNextPageParam" | "initialPageParam" | "queryFn" | "queryKey"
> &
  ConnectInfiniteQueryOptions<I, O, ParamKey> & {
    /** The transport to be used for the fetching. */
    transport?: Transport;
  };

/**
 * Query the method provided. Maps to useInfiniteQuery on tanstack/react-query
 */
export function useInfiniteQuery<
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
    pageParamKey,
    getNextPageParam,
    ...queryOptions
  }: UseInfiniteQueryOptions<I, O, ParamKey>,
): UseInfiniteQueryResult<InfiniteData<MessageShape<O>>, ConnectError> {
  const transportFromCtx = useTransport();
  const baseOptions = createInfiniteQueryOptions(schema, input, {
    transport: transport ?? transportFromCtx,
    getNextPageParam,
    pageParamKey,
  });
  return tsUseInfiniteQuery({
    ...baseOptions,
    ...queryOptions,
  });
}

/**
 * Options for useSuspenseInfiniteQuery
 */
export type UseSuspenseInfiniteQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends keyof MessageInitShape<I>,
> = Omit<
  TanStackUseSuspenseInfiniteQueryOptions<
    MessageShape<O>,
    ConnectError,
    InfiniteData<MessageShape<O>>,
    MessageShape<O>,
    ConnectInfiniteQueryKey<I>,
    MessageInitShape<I>[ParamKey]
  >,
  "getNextPageParam" | "initialPageParam" | "queryFn" | "queryKey"
> &
  ConnectInfiniteQueryOptions<I, O, ParamKey> & {
    /** The transport to be used for the fetching. */
    transport?: Transport;
  };

/**
 * Query the method provided. Maps to useSuspenseInfiniteQuery on tanstack/react-query
 */
export function useSuspenseInfiniteQuery<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends keyof MessageInitShape<I>,
>(
  schema: MethodUnaryDescriptor<I, O>,
  input: MessageInitShape<I> & Required<Pick<MessageInitShape<I>, ParamKey>>,
  {
    transport,
    pageParamKey,
    getNextPageParam,
    ...queryOptions
  }: UseSuspenseInfiniteQueryOptions<I, O, ParamKey>,
): UseSuspenseInfiniteQueryResult<InfiniteData<MessageShape<O>>, ConnectError> {
  const transportFromCtx = useTransport();
  const baseOptions = createInfiniteQueryOptions(schema, input, {
    transport: transport ?? transportFromCtx,
    getNextPageParam,
    pageParamKey,
  });
  return tsUseSuspenseInfiniteQuery({
    ...baseOptions,
    ...queryOptions,
  });
}
