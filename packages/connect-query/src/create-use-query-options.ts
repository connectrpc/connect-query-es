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
  Optional,
  QueryFunction,
  SkipToken,
  UseQueryOptions,
  UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import { skipToken } from "@tanstack/react-query";

import { callUnaryMethod } from "./call-unary-method.js";
import type { ConnectQueryKey } from "./connect-query-key.js";
import { createConnectQueryKey } from "./connect-query-key.js";
import type { MethodUnaryDescriptor } from "./method-unary-descriptor.js";
import { createStructuralSharing } from "./structural-sharing.js";

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
  I extends DescMessage,
  O extends DescMessage,
  SelectOutData = MessageShape<O>,
> = ConnectQueryOptions &
  Optional<
    UseQueryOptions<
      MessageShape<O>,
      ConnectError,
      SelectOutData,
      ConnectQueryKey<I>
    >,
    "queryKey"
  >;

/**
 * Options for useQuery
 */
export type CreateSuspenseQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
  SelectOutData = 0,
> = ConnectQueryOptions &
  Optional<
    UseSuspenseQueryOptions<
      MessageShape<O>,
      ConnectError,
      SelectOutData,
      ConnectQueryKey<I>
    >,
    "queryKey"
  >;

function createUnaryQueryFn<I extends DescMessage, O extends DescMessage>(
  schema: MethodUnaryDescriptor<I, O>,
  input: MessageInitShape<I> | undefined,
  {
    callOptions,
    transport,
  }: {
    transport: Transport;
    callOptions?: CallOptions | undefined;
  },
): QueryFunction<MessageShape<O>, ConnectQueryKey<I>> {
  return async (context) => {
    return callUnaryMethod(schema, input, {
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
  I extends DescMessage,
  O extends DescMessage,
>(
  schema: MethodUnaryDescriptor<I, O>,
  input: SkipToken | MessageInitShape<I> | undefined,
  {
    transport,
    callOptions,
  }: ConnectQueryOptions & {
    transport: Transport;
  },
): {
  queryKey: ConnectQueryKey<I>;
  queryFn: QueryFunction<MessageShape<O>, ConnectQueryKey<I>> | SkipToken;
  structuralSharing: Exclude<UseQueryOptions["structuralSharing"], undefined>;
} {
  const queryKey = createConnectQueryKey(schema, input);
  const structuralSharing = createStructuralSharing(schema.output);
  const queryFn =
    input === skipToken
      ? skipToken
      : createUnaryQueryFn(schema, input, { transport, callOptions });
  return {
    queryKey,
    queryFn,
    structuralSharing,
  };
}
