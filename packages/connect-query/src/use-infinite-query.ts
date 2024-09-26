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
import type { ConnectError, Transport } from "@connectrpc/connect";
import type {
  InfiniteData,
  UseInfiniteQueryResult,
  UseSuspenseInfiniteQueryResult,
} from "@tanstack/react-query";
import {
  useInfiniteQuery as tsUseInfiniteQuery,
  useSuspenseInfiniteQuery as tsUseSuspenseInfiniteQuery,
} from "@tanstack/react-query";

import type {
  CreateInfiniteQueryOptions,
  CreateSuspenseInfiniteQueryOptions,
} from "./create-use-infinite-query-options.js";
import { createUseInfiniteQueryOptions } from "./create-use-infinite-query-options.js";
import type { MethodUnaryDescriptor } from "./method-unary-descriptor.js";
import { useTransport } from "./use-transport.js";
import type { DisableQuery } from "./utils.js";

/**
 * Query the method provided. Maps to useInfiniteQuery on tanstack/react-query
 */
export function useInfiniteQuery<
  I extends Message<I>,
  O extends Message<O>,
  ParamKey extends keyof PartialMessage<I>,
>(
  methodSig: MethodUnaryDescriptor<I, O>,
  input:
    | DisableQuery
    | (PartialMessage<I> & Required<Pick<PartialMessage<I>, ParamKey>>),
  {
    transport,
    callOptions,
    pageParamKey,
    getNextPageParam,
    ...options
  }: Omit<CreateInfiniteQueryOptions<I, O, ParamKey>, "transport"> & {
    transport?: Transport;
  },
): UseInfiniteQueryResult<InfiniteData<O>, ConnectError> {
  const transportFromCtx = useTransport();
  const baseOptions = createUseInfiniteQueryOptions(methodSig, input, {
    transport: transport ?? transportFromCtx,
    getNextPageParam,
    pageParamKey,
    callOptions,
  });
  // The query cannot be enabled if the base options are disabled, regardless of
  // incoming query options.
  const enabled = baseOptions.enabled && (options.enabled ?? true);
  return tsUseInfiniteQuery({ ...options, ...baseOptions, enabled });
}

/**
 * Query the method provided. Maps to useSuspenseInfiniteQuery on tanstack/react-query
 */
export function useSuspenseInfiniteQuery<
  I extends Message<I>,
  O extends Message<O>,
  ParamKey extends keyof PartialMessage<I>,
>(
  methodSig: MethodUnaryDescriptor<I, O>,
  input: PartialMessage<I> & Required<Pick<PartialMessage<I>, ParamKey>>,
  {
    transport,
    callOptions,
    pageParamKey,
    getNextPageParam,
    ...options
  }: Omit<CreateSuspenseInfiniteQueryOptions<I, O, ParamKey>, "transport"> & {
    transport?: Transport;
  },
): UseSuspenseInfiniteQueryResult<InfiniteData<O>, ConnectError> {
  const transportFromCtx = useTransport();
  const baseOptions = createUseInfiniteQueryOptions(methodSig, input, {
    transport: transport ?? transportFromCtx,
    getNextPageParam,
    pageParamKey,
    callOptions,
  });

  return tsUseSuspenseInfiniteQuery({ ...options, ...baseOptions });
}
