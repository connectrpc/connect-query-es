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
  UseQueryResult,
  UseSuspenseQueryResult,
} from "@tanstack/react-query";
import {
  useQuery as tsUseQuery,
  useSuspenseQuery as tsUseSuspenseQuery,
} from "@tanstack/react-query";

import type {
  CreateQueryOptions,
  CreateSuspenseQueryOptions,
} from "./create-use-query-options";
import { createUseQueryOptions } from "./create-use-query-options";
import type { MethodUnaryDescriptor } from "./method-unary-descriptor";
import { useTransport } from "./use-transport";
import type { DisableQuery } from "./utils";

/**
 * Query the method provided. Maps to useQuery on tanstack/react-query
 *
 * @param methodSig
 * @returns
 */
export function useQuery<I extends Message<I>, O extends Message<O>>(
  methodSig: MethodUnaryDescriptor<I, O>,
  input?: DisableQuery | PartialMessage<I>,
  {
    transport,
    callOptions,
    ...queryOptions
  }: Omit<CreateQueryOptions<I, O>, "transport"> & {
    transport?: Transport;
  } = {},
): UseQueryResult<O, ConnectError> {
  const transportFromCtx = useTransport();
  const baseOptions = createUseQueryOptions(methodSig, input, {
    transport: transport ?? transportFromCtx,
    callOptions,
  });
  return tsUseQuery({
    ...queryOptions,
    ...baseOptions,
  });
}

/**
 * Query the method provided. Maps to useSuspenseQuery on tanstack/react-query
 *
 * @param methodSig
 * @returns
 */
export function useSuspenseQuery<I extends Message<I>, O extends Message<O>>(
  methodSig: MethodUnaryDescriptor<I, O>,
  input?: PartialMessage<I>,
  {
    transport,
    callOptions,
    ...queryOptions
  }: Omit<CreateSuspenseQueryOptions<I, O>, "transport"> & {
    transport?: Transport;
  } = {},
): UseSuspenseQueryResult<O, ConnectError> {
  const transportFromCtx = useTransport();
  const baseOptions = createUseQueryOptions(methodSig, input, {
    transport: transport ?? transportFromCtx,
    callOptions,
  });
  return tsUseSuspenseQuery({
    ...queryOptions,
    ...baseOptions,
  });
}
