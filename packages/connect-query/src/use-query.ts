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
  SkipToken,
  UseQueryOptions as TanStackUseQueryOptions,
  UseQueryResult,
  UseSuspenseQueryOptions as TanStackUseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from "@tanstack/react-query";
import {
  useQuery as tsUseQuery,
  useSuspenseQuery as tsUseSuspenseQuery,
} from "@tanstack/react-query";

import type { ConnectQueryKey } from "./connect-query-key.js";
import { createQueryOptions } from "./create-query-options.js";
import type { MethodUnaryDescriptor } from "./method-unary-descriptor.js";
import { useTransport } from "./use-transport.js";

/**
 * Options for useQuery
 */
export type UseQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
  SelectOutData = MessageShape<O>,
> = Omit<
  TanStackUseQueryOptions<
    MessageShape<O>,
    ConnectError,
    SelectOutData,
    ConnectQueryKey<I>
  >,
  "queryFn" | "queryKey"
> & {
  /** The transport to be used for the fetching. */
  transport?: Transport;
};

/**
 * Query the method provided. Maps to useQuery on tanstack/react-query
 */
export function useQuery<
  I extends DescMessage,
  O extends DescMessage,
  SelectOutData = MessageShape<O>,
>(
  schema: MethodUnaryDescriptor<I, O>,
  input?: SkipToken | MessageInitShape<I>,
  { transport, ...queryOptions }: UseQueryOptions<I, O, SelectOutData> = {},
): UseQueryResult<SelectOutData, ConnectError> {
  const transportFromCtx = useTransport();
  const baseOptions = createQueryOptions(schema, input, {
    transport: transport ?? transportFromCtx,
  });
  return tsUseQuery({
    ...baseOptions,
    ...queryOptions,
  });
}

/**
 * Options for useSuspenseQuery
 */
export type UseSuspenseQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
  SelectOutData = 0,
> = Omit<
  TanStackUseSuspenseQueryOptions<
    MessageShape<O>,
    ConnectError,
    SelectOutData,
    ConnectQueryKey<I>
  >,
  "queryFn" | "queryKey"
> & {
  /** The transport to be used for the fetching. */
  transport?: Transport;
};

/**
 * Query the method provided. Maps to useSuspenseQuery on tanstack/react-query
 */
export function useSuspenseQuery<
  I extends DescMessage,
  O extends DescMessage,
  SelectOutData = MessageShape<O>,
>(
  schema: MethodUnaryDescriptor<I, O>,
  input?: MessageInitShape<I>,
  {
    transport,
    ...queryOptions
  }: UseSuspenseQueryOptions<I, O, SelectOutData> = {},
): UseSuspenseQueryResult<SelectOutData, ConnectError> {
  const transportFromCtx = useTransport();
  const baseOptions = createQueryOptions(schema, input, {
    transport: transport ?? transportFromCtx,
  });
  return tsUseSuspenseQuery({
    ...baseOptions,
    ...queryOptions,
  });
}
