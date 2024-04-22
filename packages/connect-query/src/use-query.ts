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
import {
  type ConnectQueryKey,
  type ConnectQueryOptions,
  createQueryOptions,
  type DisableQuery,
  type MethodUnaryDescriptor,
} from "@connectrpc/connect-query-core";
import type {
  UseQueryOptions as TSUseQueryOptions,
  UseQueryResult,
  UseSuspenseQueryOptions as TSUseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from "@tanstack/react-query";
import {
  useQuery as tsUseQuery,
  useSuspenseQuery as tsUseSuspenseQuery,
} from "@tanstack/react-query";

import { useTransport } from "./use-transport.js";

/**
 * Options for useQuery
 */
export type UseQueryOptions<
  I extends Message<I>,
  O extends Message<O>,
  SelectOutData = 0,
> = ConnectQueryOptions &
  Omit<
    TSUseQueryOptions<O, ConnectError, SelectOutData, ConnectQueryKey<I>>,
    "queryFn" | "queryKey"
  >;

/**
 * Options for useSuspenseQuery
 */
export type UseSuspenseQueryOptions<
  I extends Message<I>,
  O extends Message<O>,
  SelectOutData = 0,
> = ConnectQueryOptions &
  Omit<
    TSUseSuspenseQueryOptions<
      O,
      ConnectError,
      SelectOutData,
      ConnectQueryKey<I>
    >,
    "queryFn" | "queryKey"
  >;

/**
 * Query the method provided. Maps to useQuery on tanstack/react-query
 *
 * @param methodSig
 * @returns
 */
export function useQuery<
  I extends Message<I>,
  O extends Message<O>,
  SelectOutData = O,
>(
  methodSig: MethodUnaryDescriptor<I, O>,
  input?: DisableQuery | PartialMessage<I>,
  {
    transport,
    callOptions,
    ...queryOptions
  }: Omit<UseQueryOptions<I, O, SelectOutData>, "transport"> & {
    transport?: Transport;
  } = {},
): UseQueryResult<SelectOutData, ConnectError> {
  const transportFromCtx = useTransport();
  const baseOptions = createQueryOptions(methodSig, input, {
    transport: transport ?? transportFromCtx,
    callOptions,
  });
  // The query cannot be enabled if the base options are disabled, regardless of
  // incoming query options.
  const enabled = baseOptions.enabled && (queryOptions.enabled ?? true);
  return tsUseQuery({
    ...queryOptions,
    ...baseOptions,
    enabled,
  });
}

/**
 * Query the method provided. Maps to useSuspenseQuery on tanstack/react-query
 *
 * @param methodSig
 * @returns
 */
export function useSuspenseQuery<
  I extends Message<I>,
  O extends Message<O>,
  SelectOutData = O,
>(
  methodSig: MethodUnaryDescriptor<I, O>,
  input?: PartialMessage<I>,
  {
    transport,
    callOptions,
    ...queryOptions
  }: Omit<UseSuspenseQueryOptions<I, O, SelectOutData>, "transport"> & {
    transport?: Transport;
  } = {},
): UseSuspenseQueryResult<SelectOutData, ConnectError> {
  const transportFromCtx = useTransport();
  const baseOptions = createQueryOptions(methodSig, input, {
    transport: transport ?? transportFromCtx,
    callOptions,
  });
  return tsUseSuspenseQuery({
    ...queryOptions,
    ...baseOptions,
  });
}
