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
import type { ConnectQueryKey } from "@connectrpc/connect-query-core";
import { createQueryOptions } from "@connectrpc/connect-query-core";
import type {
  SuspenseQueriesResults,
  UseSuspenseQueryOptions as TanStackUseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from "@tanstack/react-query";
import { useSuspenseQueries as tsUseSuspenseQueries } from "@tanstack/react-query";

import type { UseSuspenseQueryOptions } from "./use-query.js";
import { useTransport } from "./use-transport.js";

/** Options for one RPC in useSuspenseQueries. */
export type SuspenseQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
  SelectOutData = MessageShape<O>,
> = UseSuspenseQueryOptions<O, SelectOutData> & {
  schema: DescMethodUnary<I, O>;
  input?: MessageInitShape<I>;
};

// Infer selected data separately from method schemas so select receives the
// concrete response type while its return type is preserved for each result.
type Results<
  T extends readonly DescMethodUnary[],
  S extends readonly unknown[],
> = {
  -readonly [K in keyof T]: UseSuspenseQueryResult<
    K extends keyof S
      ? unknown extends S[K]
        ? MessageShape<T[K]["output"]>
        : S[K]
      : MessageShape<T[K]["output"]>,
    ConnectError
  >;
};

/** Query multiple methods in parallel, suspending until all results are available. */
export function useSuspenseQueries<
  const T extends readonly DescMethodUnary[],
  const S extends readonly unknown[],
  Combined = Results<T, S>,
>({
  queries,
  combine,
}: {
  queries: readonly [
    ...{
      [K in keyof T]: SuspenseQueryOptions<
        T[K]["input"],
        T[K]["output"],
        unknown
      > & { schema: T[K] };
    },
  ] &
    readonly [
      ...{
        [K in keyof S]: {
          [P in keyof SuspenseQueryOptions<DescMessage, DescMessage>]?: unknown;
        } & { select?: (data: never) => S[K] };
      },
    ];
  combine?: (results: Results<T, S>) => Combined;
}): Combined {
  const transportFromCtx = useTransport();
  type Output = T[number]["output"];
  const options: TanStackUseSuspenseQueryOptions<
    MessageShape<Output>,
    ConnectError,
    unknown,
    ConnectQueryKey<Output>
  >[] = queries.map(
    ({ schema, input, transport, headers, ...queryOptions }) => ({
      ...createQueryOptions(schema, input, {
        transport: transport ?? transportFromCtx,
        headers,
      }),
      ...queryOptions,
    }),
  );
  // Array.map loses tuple positions; restore only the callback's tuple shape.
  return tsUseSuspenseQueries({
    queries: options,
    combine: combine as
      | ((results: SuspenseQueriesResults<typeof options>) => Combined)
      | undefined,
  });
}
