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
import { create } from "@bufbuild/protobuf";
import type { Transport } from "@connectrpc/connect";
import type { QueryFunction, SkipToken } from "@tanstack/query-core";
import { skipToken } from "@tanstack/query-core";

import { callUnaryMethod } from "./call-unary-method.js";
import type { ConnectQueryKey } from "./connect-query-key.js";
import { createConnectQueryKey } from "./connect-query-key.js";
import { createStructuralSharing } from "./structural-sharing.js";

function createUnaryQueryFn<I extends DescMessage, O extends DescMessage>(
  transport: Transport,
  schema: DescMethodUnary<I, O>,
  input: MessageInitShape<I> | undefined
): QueryFunction<MessageShape<O>, ConnectQueryKey> {
  return async (context) => {
    return callUnaryMethod(transport, schema, input, {
      signal: context.signal,
    });
  };
}

/**
 * Creates all options required to make a query. Useful in combination with `useQueries` from tanstack/react-query.
 */
export function createQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
>(
  schema: DescMethodUnary<I, O>,
  input: MessageInitShape<I> | undefined,
  {
    transport,
  }: {
    transport: Transport;
  },
): {
  queryKey: ConnectQueryKey;
  queryFn: QueryFunction<MessageShape<O>, ConnectQueryKey>;
  structuralSharing: (oldData: unknown, newData: unknown) => unknown;
};
export function createQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
>(
  schema: DescMethodUnary<I, O>,
  input: SkipToken,
  {
    transport,
  }: {
    transport: Transport;
  },
): {
  queryKey: ConnectQueryKey;
  queryFn: SkipToken;
  structuralSharing: (oldData: unknown, newData: unknown) => unknown;
};
export function createQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
>(
  schema: DescMethodUnary<I, O>,
  input: SkipToken | MessageInitShape<I> | undefined,
  {
    transport,
  }: {
    transport: Transport;
  },
): {
  queryKey: ConnectQueryKey;
  queryFn: QueryFunction<MessageShape<O>, ConnectQueryKey> | SkipToken;
  structuralSharing: (oldData: unknown, newData: unknown) => unknown;
};
export function createQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
>(
  schema: DescMethodUnary<I, O>,
  input: SkipToken | MessageInitShape<I> | undefined,
  {
    transport,
  }: {
    transport: Transport;
  }
): {
  queryKey: ConnectQueryKey;
  queryFn: QueryFunction<MessageShape<O>, ConnectQueryKey> | SkipToken;
  structuralSharing: (oldData: unknown, newData: unknown) => unknown;
} {
  const queryKey = createConnectQueryKey({
    schema,
    input: input ?? create(schema.input),
    transport,
    cardinality: "finite",
  });
  const structuralSharing = createStructuralSharing(schema.output);
  const queryFn =
    input === skipToken
      ? skipToken
      : createUnaryQueryFn(transport, schema, input);
  return {
    queryKey,
    queryFn,
    structuralSharing,
  };
}
