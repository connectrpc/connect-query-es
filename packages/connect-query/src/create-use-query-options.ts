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
  QueryFunction,
  UseQueryOptions,
  UseSuspenseQueryOptions,
} from "@tanstack/react-query";

import { callUnaryMethod } from "./call-unary-method.js";
import type { ConnectQueryKey } from "./connect-query-key.js";
import { createConnectQueryKey } from "./connect-query-key.js";
import type { MethodUnaryDescriptor } from "./method-unary-descriptor.js";
import { assert, type DisableQuery, disableQuery } from "./utils.js";

export interface ConnectQueryOptions {
  /** The transport to be used for the fetching. */
  transport: Transport;
  /** Any additional call options to provide the transport on call. */
  callOptions?: Omit<CallOptions, "signal"> | undefined;
}

/**
 * Options for useQuery
 */
export type CreateQueryOptions<
  I extends Message<I>,
  O extends Message<O>,
  SelectOutData = 0,
> = ConnectQueryOptions &
  Omit<
    UseQueryOptions<O, ConnectError, SelectOutData, ConnectQueryKey<I>>,
    "queryFn" | "queryKey"
  >;

/**
 * Options for useQuery
 */
export type CreateSuspenseQueryOptions<
  I extends Message<I>,
  O extends Message<O>,
  SelectOutData = 0,
> = ConnectQueryOptions &
  Omit<
    UseSuspenseQueryOptions<O, ConnectError, SelectOutData, ConnectQueryKey<I>>,
    "queryFn" | "queryKey"
  >;

function createUnaryQueryFn<I extends Message<I>, O extends Message<O>>(
  methodType: MethodUnaryDescriptor<I, O>,
  input: DisableQuery | PartialMessage<I> | undefined,
  {
    callOptions,
    transport,
  }: {
    transport: Transport;
    callOptions?: CallOptions | undefined;
  },
): QueryFunction<O, ConnectQueryKey<I>> {
  return async (context) => {
    assert(input !== disableQuery, "Disabled query cannot be fetched");
    return callUnaryMethod(methodType, input, {
      callOptions: {
        ...callOptions,
        signal: callOptions?.signal ?? context.signal,
      },
      transport,
    });
  };
}

/**
 * Creates all options required to make a query. Useful in combination with `useQueries` from tanstack/react-query.
 */
export function createUseQueryOptions<
  I extends Message<I>,
  O extends Message<O>,
>(
  methodSig: MethodUnaryDescriptor<I, O>,
  input: DisableQuery | PartialMessage<I> | undefined,
  {
    transport,
    callOptions,
  }: ConnectQueryOptions & {
    transport: Transport;
  },
): {
  queryKey: ConnectQueryKey<I>;
  queryFn: QueryFunction<O, ConnectQueryKey<I>>;
  enabled: boolean | undefined;
} {
  const queryKey = createConnectQueryKey(methodSig, input);
  return {
    queryKey,
    queryFn: createUnaryQueryFn(methodSig, input, {
      transport,
      callOptions,
    }),
    enabled: input === disableQuery ? false : undefined,
  };
}
