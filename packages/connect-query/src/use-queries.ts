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
import type { ConnectError } from "@connectrpc/connect";
import type {
  ConnectQueryKey,
  SkipToken,
} from "@connectrpc/connect-query-core";
import { createQueryOptions } from "@connectrpc/connect-query-core";
import type {
  QueriesResults,
  UseQueryOptions as TanStackUseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { useQueries as tsUseQueries } from "@tanstack/react-query";

import type { UseQueryOptions } from "./use-query.js";
import { useTransport } from "./use-transport.js";

/** Options for one RPC in useQueries. */
export type QueriesQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
  SelectOutData = MessageShape<O>,
> = Omit<
  UseQueryOptions<O, SelectOutData>,
  "placeholderData" | "subscribed"
> & {
  /** Unlike useQuery, useQueries does not provide previous data to this callback. */
  placeholderData?: MessageShape<O> | (() => MessageShape<O> | undefined);
  headers?: HeadersInit;
  schema: DescMethodUnary<I, O>;
  input?: SkipToken | MessageInitShape<I>;
};

// Infer selected data separately from method schemas so select receives the
// concrete response type while its return type is preserved for each result.
type Results<
  T extends readonly DescMethodUnary[],
  S extends readonly unknown[],
> = {
  -readonly [K in keyof T]: UseQueryResult<
    K extends keyof S
      ? unknown extends S[K]
        ? MessageShape<T[K]["output"]>
        : S[K]
      : MessageShape<T[K]["output"]>,
    ConnectError
  >;
};

/** Query multiple methods in parallel. Maps to useQueries on tanstack/react-query. */
export function useQueries<
  const T extends readonly DescMethodUnary[],
  const S extends readonly unknown[],
  Combined = Results<T, S>,
>({
  queries,
  combine,
}: {
  queries: readonly [
    ...{
      [K in keyof T]: QueriesQueryOptions<
        T[K]["input"],
        T[K]["output"],
        unknown
      > & { schema: T[K] };
    },
  ] &
    readonly [
      ...{
        [K in keyof S]: {
          [P in keyof QueriesQueryOptions<DescMessage, DescMessage>]?: unknown;
        } & { select?: (data: never) => S[K] };
      },
    ];
  combine?: (results: Results<T, S>) => Combined;
}): Combined {
  const transportFromCtx = useTransport();
  type Output = T[number]["output"];
  const options: (Omit<
    TanStackUseQueryOptions<
      MessageShape<Output>,
      ConnectError,
      unknown,
      ConnectQueryKey<Output>
    >,
    "placeholderData" | "subscribed"
  > & {
    placeholderData?:
      | MessageShape<Output>
      | (() => MessageShape<Output> | undefined);
  })[] = queries.map(
    ({ schema, input, transport, headers, ...queryOptions }) => ({
      ...createQueryOptions(schema, input, {
        transport: transport ?? transportFromCtx,
        headers,
      }),
      ...queryOptions,
    }),
  );
  // Array.map loses tuple positions; restore only the callback's tuple shape.
  return tsUseQueries({
    queries: options,
    combine: combine as
      | ((results: QueriesResults<typeof options>) => Combined)
      | undefined,
  });
}
