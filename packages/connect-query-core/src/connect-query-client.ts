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

import {
  create,
  isMessage,
  type DescMessage,
  type DescMethod,
  type DescMethodUnary,
  type DescService,
  type MessageInitShape,
  type MessageShape,
} from "@bufbuild/protobuf";
import type { ConnectError, Transport } from "@connectrpc/connect";
import type {
  FetchInfiniteQueryOptions as TanstackFetchInfiniteQueryOptions,
  FetchQueryOptions as TanstackFetchQueryOptions,
  InfiniteData,
  InvalidateOptions,
  InvalidateQueryFilters,
  QueryFilters,
  QueryState,
  RefetchOptions,
  RefetchQueryFilters,
  ResetOptions,
  SetDataOptions,
  Updater,
} from "@tanstack/query-core";
import { QueryClient as TSQueryClient } from "@tanstack/query-core";

import type { ConnectQueryKey } from "./connect-query-key.js";
import { createConnectQueryKey } from "./connect-query-key.js";
import type { ConnectInfiniteQueryOptions } from "./create-infinite-query-options.js";
import { createInfiniteQueryOptions } from "./create-infinite-query-options.js";
import { createQueryOptions } from "./create-query-options.js";

type FetchQueryOptions<
  O extends DescMessage,
  SelectOutData = MessageShape<O>,
> = Omit<
  TanstackFetchQueryOptions<
    MessageShape<O>,
    ConnectError,
    SelectOutData,
    ConnectQueryKey
  >,
  "queryFn" | "queryKey"
> & {
  /** The transport to be used for the fetching. */
  transport?: Transport;
};

type FetchInfiniteQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends keyof MessageInitShape<I>,
> = Omit<
  TanstackFetchInfiniteQueryOptions<
    MessageShape<O>,
    ConnectError,
    MessageShape<O>,
    ConnectQueryKey,
    MessageInitShape<I>[ParamKey]
  >,
  "getNextPageParam" | "initialPageParam" | "queryFn" | "queryKey"
> &
  ConnectInfiniteQueryOptions<I, O, ParamKey> & {
    transport: Transport;
  };

type KeyParamsForMethod<Desc extends DescMethod> = {
  /**
   * Set `serviceName` and `methodName` in the key.
   */
  schema: Desc;
  /**
   * Set `input` in the key:
   * - If a SkipToken is provided, `input` is "skipped".
   * - If an init shape is provided, `input` is set to a message key.
   * - If omitted or undefined, `input` is not set in the key.
   */
  input?: MessageInitShape<Desc["input"]> | undefined;
  /**
   * Set `transport` in the key.
   */
  transport?: Transport;
  /**
   * Set `cardinality` in the key - undefined is used for filters to match both finite and infinite queries.
   */
  cardinality?: "finite" | "infinite";
  /**
   * If omit the field with this name from the key for infinite queries.
   */
  pageParamKey?: keyof MessageInitShape<Desc["input"]>;
};

type KeyParamsForService<Desc extends DescService> = {
  /**
   * Set `serviceName` in the key, and omit `methodName`.
   */
  schema: Desc;
  /**
   * Set `transport` in the key.
   */
  transport?: Transport;
  /**
   * Set `cardinality` in the key - undefined is used for filters to match both finite and infinite queries.
   */
  cardinality?: "finite" | "infinite";
};

/**
 * A custom query client that adds some useful methods to access typesafe query data and other shortcuts.
 */
export interface ConnectQueryClient {
  /**
   * Invalidate and refetch all queries that match the given schema. This
   * can include all queries for a service (and sub methods), or all queries for a method.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientinvalidatequeries}
   */
  invalidateConnectQueries<
    I extends DescMessage,
    O extends DescMessage,
    Desc extends DescService,
  >(
    params:
      | KeyParamsForMethod<DescMethodUnary<I, O>>
      | KeyParamsForService<Desc>,
    filterOptions?: Omit<InvalidateQueryFilters, "queryKey">,
    options?: InvalidateOptions,
  ): Promise<void>;

  /**
   * Refetch all queries that match the given schema. This can include all queries for a service (and sub methods),
   * or all queries for a method.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientrefetchqueries}
   */
  refetchConnectQueries<
    I extends DescMessage,
    O extends DescMessage,
    Desc extends DescService,
  >(
    params:
      | KeyParamsForMethod<DescMethodUnary<I, O>>
      | KeyParamsForService<Desc>,
    filterOptions?: Omit<RefetchQueryFilters, "queryKey">,
    options?: RefetchOptions,
  ): Promise<void>;

  /**
   * Set the data for a single query. The query must match exactly the input provided, as well
   * as the transport and cardinality (whether it was a finite or infinite query).
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientsetquerydata}
   */
  setConnectQueryData<I extends DescMessage, O extends DescMessage>(
    keyDescriptor: {
      schema: DescMethodUnary<I, O>;
      input?: MessageInitShape<I>;
      transport: Transport;
      cardinality: "infinite";
    },
    updater: ConnectInfiniteUpdater<O>,
    options?: SetDataOptions,
  ): O;
  setConnectQueryData<I extends DescMessage, O extends DescMessage>(
    keyDescriptor: {
      schema: DescMethodUnary<I, O>;
      input?: MessageInitShape<I>;
      transport: Transport;
      cardinality: "finite";
    },
    updater: ConnectUpdater<O>,
    options?: SetDataOptions,
  ): O;

  /**
   * Get the data for a single query. The query must match exactly the input provided, as well
   * as the transport and cardinality (whether it was a finite or infinite query).
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientgetquerydata}
   */
  getConnectQueryData<
    I extends DescMessage,
    O extends DescMessage,
  >(keyDescriptor: {
    schema: DescMethodUnary<I, O>;
    input?: MessageInitShape<I>;
    transport: Transport;
    cardinality: "finite";
  }): MessageShape<O> | undefined;
  getConnectQueryData<
    I extends DescMessage,
    O extends DescMessage,
  >(keyDescriptor: {
    schema: DescMethodUnary<I, O>;
    input?: MessageInitShape<I>;
    transport: Transport;
    cardinality: "infinite";
  }): InfiniteData<MessageShape<O>> | undefined;

  /**
   * Sets the data for any matching queries for a given method. The input is optional, and anything left
   * as undefined will greedily match queries.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientsetqueriesdata}
   */
  setConnectQueriesData<I extends DescMessage, O extends DescMessage>(
    keyDescriptor: {
      schema: DescMethodUnary<I, O>;
      input?: MessageInitShape<I>;
      transport?: Transport;
      cardinality: "finite";
    },
    updater: ConnectUpdater<O>,
    options?: SetDataOptions & {
      exact?: boolean;
    },
  ): [readonly unknown[], unknown][];
  setConnectQueriesData<I extends DescMessage, O extends DescMessage>(
    keyDescriptor: {
      schema: DescMethodUnary<I, O>;
      input?: MessageInitShape<I>;
      transport?: Transport;
      cardinality: "infinite";
    },
    updater: ConnectInfiniteUpdater<O>,
    options?: SetDataOptions & {
      exact?: boolean;
    },
  ): [readonly unknown[], unknown][];

  /**
   * Fetch a single query and return the result.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientfetchquery}
   */
  fetchConnectQuery<
    I extends DescMessage,
    O extends DescMessage,
    SelectOutData = MessageShape<O>,
  >(
    schema: DescMethodUnary<I, O>,
    input: MessageInitShape<I> | undefined,
    {
      transport,
      ...queryOptions
    }: {
      transport: Transport;
    } & FetchQueryOptions<O, SelectOutData>,
  ): Promise<SelectOutData>;

  /**
   * Fetch a single infinite query and return the result.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientfetchinfinitequery}
   */
  fetchConnectInfiniteQuery<
    I extends DescMessage,
    O extends DescMessage,
    ParamKey extends keyof MessageInitShape<I>,
  >(
    schema: DescMethodUnary<I, O>,
    input: MessageInitShape<I> & Required<Pick<MessageInitShape<I>, ParamKey>>,
    {
      transport,
      getNextPageParam,
      pageParamKey,
      ...queryOptions
    }: FetchInfiniteQueryOptions<I, O, ParamKey>,
  ): Promise<InfiniteData<MessageShape<O>>>;

  /**
   * Prefetch a single query and discard the result.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientprefetchquery}
   */
  prefetchConnectQuery<
    I extends DescMessage,
    O extends DescMessage,
    SelectOutData = MessageShape<O>,
  >(
    schema: DescMethodUnary<I, O>,
    input: MessageInitShape<I> | undefined,
    {
      transport,
      ...queryOptions
    }: {
      transport: Transport;
    } & FetchQueryOptions<O, SelectOutData>,
  ): Promise<void>;

  /**
   * Prefetch a single infinite query and discard the result.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientprefetchinfinitequery}
   */
  prefetchConnectInfiniteQuery<
    I extends DescMessage,
    O extends DescMessage,
    ParamKey extends keyof MessageInitShape<I>,
  >(
    schema: DescMethodUnary<I, O>,
    input: MessageInitShape<I> & Required<Pick<MessageInitShape<I>, ParamKey>>,
    {
      transport,
      getNextPageParam,
      pageParamKey,
      ...queryOptions
    }: FetchInfiniteQueryOptions<I, O, ParamKey>,
  ): Promise<void>;

  /**
   * Get the query state for a single query. The query must match exactly the input provided, as well
   * as the transport and cardinality (whether it was a finite or infinite query).
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientgetquerystate}
   */
  getConnectQueryState<Desc extends DescMethodUnary>(keyDescriptor: {
    schema: Desc;
    input?: MessageInitShape<Desc["input"]>;
    transport: Transport;
    cardinality: "finite";
  }): QueryState<MessageShape<Desc["output"]>, ConnectError> | undefined;
  getConnectQueryState<Desc extends DescMethodUnary>(keyDescriptor: {
    schema: Desc;
    input?: MessageInitShape<Desc["input"]>;
    transport: Transport;
    cardinality: "infinite";
  }):
    | QueryState<InfiniteData<MessageShape<Desc["output"]>>, ConnectError>
    | undefined;

  /**
   * Ensure the query data for a single query. The query must match exactly the input provided, as well
   * as the transport and cardinality (whether it was a finite or infinite query).
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientensurequerydata}
   */
  ensureConnectQueryData<
    I extends DescMessage,
    O extends DescMessage,
    SelectOutData = MessageShape<O>,
  >(
    schema: DescMethodUnary<I, O>,
    input: MessageInitShape<I> | undefined,
    {
      transport,
      ...queryOptions
    }: {
      transport: Transport;
    } & FetchQueryOptions<O, SelectOutData>,
  ): Promise<SelectOutData>;

  /**
   * Ensure the query data for a single infinite query. The query must match exactly the input provided, as well
   * as the transport and cardinality (whether it was a finite or infinite query).
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientensureinfinitequerydata}
   */
  ensureConnectInfiniteQueryData<
    I extends DescMessage,
    O extends DescMessage,
    ParamKey extends keyof MessageInitShape<I>,
  >(
    schema: DescMethodUnary<I, O>,
    input: MessageInitShape<I> & Required<Pick<MessageInitShape<I>, ParamKey>>,
    {
      transport,
      getNextPageParam,
      pageParamKey,
      ...queryOptions
    }: FetchInfiniteQueryOptions<I, O, ParamKey>,
  ): Promise<InfiniteData<MessageShape<O>>>;

  /**
   * Get all data entries that match the given schema. This
   * can include all queries for a service (and sub methods), or all queries for a method.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientgetqueriesdata}
   */
  getConnectQueriesData<
    I extends DescMessage,
    O extends DescMessage,
    Desc extends DescService,
  >(
    params:
      | KeyParamsForMethod<DescMethodUnary<I, O>>
      | KeyParamsForService<Desc>,
    filterOptions?: Omit<QueryFilters, "queryKey">,
  ): unknown;

  /**
   * Cancels any outgoing queries that match the given schema. This
   * can include all queries for a service (and sub methods), or all queries for a method.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientcancelqueries}
   */
  cancelConnectQueries<
    I extends DescMessage,
    O extends DescMessage,
    Desc extends DescService,
  >(
    params:
      | KeyParamsForMethod<DescMethodUnary<I, O>>
      | KeyParamsForService<Desc>,
    filterOptions?: Omit<QueryFilters, "queryKey">,
  ): Promise<void>;

  /**
   * Removes any queries from the cache that match the given schema. This
   * can include all queries for a service (and sub methods), or all queries for a method.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientremovequeries}
   */
  removeConnectQueries<
    I extends DescMessage,
    O extends DescMessage,
    Desc extends DescService,
  >(
    params:
      | KeyParamsForMethod<DescMethodUnary<I, O>>
      | KeyParamsForService<Desc>,
    filterOptions?: Omit<QueryFilters, "queryKey">,
  ): void;

  /**
   * Resets any queries that match the given schema. This
   * can include all queries for a service (and sub methods), or all queries for a method.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientresetqueries}
   */
  resetConnectQueries<
    I extends DescMessage,
    O extends DescMessage,
    Desc extends DescService,
  >(
    params:
      | KeyParamsForMethod<DescMethodUnary<I, O>>
      | KeyParamsForService<Desc>,
    filterOptions?: Omit<QueryFilters, "queryKey">,
    options?: ResetOptions,
  ): Promise<void>;
}

export function createConnectQueryClient(queryClient: TSQueryClient) {
  const connectQueryClient: ConnectQueryClient = {
    async invalidateConnectQueries(params, filterOptions, options) {
      return queryClient.invalidateQueries(
        {
          ...filterOptions,
          queryKey: createConnectQueryKey({
            ...params,
            cardinality: params.cardinality,
          }),
        },
        options,
      );
    },

    async refetchConnectQueries(params, filterOptions, options) {
      return queryClient.refetchQueries(
        {
          ...filterOptions,
          queryKey: createConnectQueryKey({
            ...params,
            cardinality: params.cardinality,
          }),
        },
        options,
      );
    },

    setConnectQueryData<I extends DescMessage, O extends DescMessage>(
      keyDescriptor: {
        schema: DescMethodUnary<I, O>;
        input?: MessageInitShape<I>;
        transport: Transport;
        cardinality: "finite" | "infinite";
      },
      updater: ConnectUpdater<O> | ConnectInfiniteUpdater<O>,
      options?: SetDataOptions,
    ): O | undefined {
      const safeUpdater =
        keyDescriptor.cardinality === "infinite"
          ? createProtobufSafeInfiniteUpdater<O>(
              keyDescriptor.schema,
              updater as ConnectInfiniteUpdater<O>,
            )
          : createProtobufSafeUpdater<O>(
              keyDescriptor.schema,
              updater as ConnectUpdater<O>,
            );
      return queryClient.setQueryData(
        createConnectQueryKey({
          ...keyDescriptor,
          // Since we are matching on the exact input, we match what connect-query does in createQueryOptions
          input: keyDescriptor.input ?? ({} as MessageInitShape<I>),
        }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any --  Need this override to keep avoid issues with NoInfer type messing with type checks
        safeUpdater as any,
        options,
      );
    },

    getConnectQueryData(keyDescriptor) {
      return queryClient.getQueryData(createConnectQueryKey(keyDescriptor));
    },

    setConnectQueriesData<I extends DescMessage, O extends DescMessage>(
      keyDescriptor: {
        schema: DescMethodUnary<I, O>;
        input?: MessageInitShape<I>;
        transport?: Transport;
        cardinality: "infinite" | "finite";
      },
      updater: ConnectInfiniteUpdater<O> | ConnectUpdater<O>,
      options?: SetDataOptions & {
        exact?: boolean;
      },
    ): [readonly unknown[], unknown][] {
      const safeUpdater =
        keyDescriptor.cardinality === "finite"
          ? createProtobufSafeUpdater<O>(
              keyDescriptor.schema,
              updater as ConnectUpdater<O>,
            )
          : createProtobufSafeInfiniteUpdater<O>(
              keyDescriptor.schema,
              updater as ConnectInfiniteUpdater<O>,
            );
      return queryClient.setQueriesData(
        {
          queryKey: createConnectQueryKey({
            ...keyDescriptor,
            cardinality: keyDescriptor.cardinality,
          }),
          exact: options?.exact ?? false,
        },
        safeUpdater,
        options,
      );
    },

    fetchConnectQuery(schema, input, { transport, ...queryOptions }) {
      return queryClient.fetchQuery({
        ...createQueryOptions(schema, input, { transport }),
        ...queryOptions,
      });
    },
    fetchConnectInfiniteQuery(
      schema,
      input,
      { transport, getNextPageParam, pageParamKey, ...queryOptions },
    ) {
      return queryClient.fetchInfiniteQuery({
        ...createInfiniteQueryOptions(schema, input, {
          transport,
          pageParamKey,
          getNextPageParam,
        }),
        ...queryOptions,
      });
    },
    prefetchConnectQuery(schema, input, { transport, ...queryOptions }) {
      return queryClient.prefetchQuery({
        ...createQueryOptions(schema, input, { transport }),
        ...queryOptions,
      });
    },

    prefetchConnectInfiniteQuery(
      schema,
      input,
      { transport, getNextPageParam, pageParamKey, ...queryOptions },
    ) {
      return queryClient.prefetchInfiniteQuery({
        ...createInfiniteQueryOptions(schema, input, {
          transport,
          pageParamKey,
          getNextPageParam,
        }),
        ...queryOptions,
      });
    },
    getConnectQueryState(keyDescriptor) {
      return queryClient.getQueryState(createConnectQueryKey(keyDescriptor));
    },

    ensureConnectQueryData(schema, input, { transport, ...queryOptions }) {
      return queryClient.ensureQueryData({
        ...createQueryOptions(schema, input, { transport }),
        ...queryOptions,
      });
    },
    ensureConnectInfiniteQueryData(
      schema,
      input,
      { transport, getNextPageParam, pageParamKey, ...queryOptions },
    ) {
      return queryClient.ensureInfiniteQueryData({
        ...createInfiniteQueryOptions(schema, input, {
          transport,
          pageParamKey,
          getNextPageParam,
        }),
        ...queryOptions,
      });
    },
    getConnectQueriesData(params, filterOptions) {
      return queryClient.getQueriesData({
        ...filterOptions,
        queryKey: createConnectQueryKey({
          ...params,
          cardinality: params.cardinality,
        }),
      });
    },
    cancelConnectQueries(params, filterOptions) {
      return queryClient.cancelQueries({
        ...filterOptions,
        queryKey: createConnectQueryKey({
          ...params,
          cardinality: params.cardinality,
        }),
      });
    },
    removeConnectQueries(params, filterOptions) {
      queryClient.removeQueries({
        ...filterOptions,
        queryKey: createConnectQueryKey({
          ...params,
          cardinality: params.cardinality,
        }),
      });
      return;
    },
    resetConnectQueries(params, filterOptions, options) {
      return queryClient.resetQueries(
        {
          ...filterOptions,
          queryKey: createConnectQueryKey({
            ...params,
            cardinality: params.cardinality,
          }),
        },
        options,
      );
    },
  };
  return connectQueryClient;
}

type ConnectInfiniteUpdater<O extends DescMessage> =
  | InfiniteData<MessageInitShape<O>>
  | undefined
  | ((
      prev?: InfiniteData<MessageShape<O>>,
    ) => InfiniteData<MessageShape<O>> | undefined);

const createProtobufSafeInfiniteUpdater =
  <O extends DescMessage>(
    schema: Pick<DescMethodUnary<never, O>, "output">,
    updater: ConnectInfiniteUpdater<O>,
  ) =>
  (
    prev: InfiniteData<MessageShape<O>> | undefined,
  ): InfiniteData<MessageShape<O>> | undefined => {
    if (typeof updater !== "function") {
      if (updater === undefined) {
        return undefined;
      }
      return {
        pageParams: updater.pageParams,
        pages: updater.pages.map((i) => create(schema.output, i)),
      };
    }
    const result = updater(prev);
    if (result === undefined) {
      return undefined;
    }
    return {
      pageParams: result.pageParams,
      pages: result.pages.map((i) => create(schema.output, i)),
    };
  };

type ConnectUpdater<O extends DescMessage> =
  | MessageInitShape<O>
  | undefined
  | ((prev?: MessageShape<O>) => MessageInitShape<O> | undefined);

/**
 * This method makes sure that the object returned
 * is of the message type. If an init shape is returned,
 * we'll run it through create again.
 */
const createProtobufSafeUpdater: <O extends DescMessage>(
  schema: Pick<DescMethodUnary<never, O>, "output">,
  updater: ConnectUpdater<O>,
) => Updater<MessageShape<O>, MessageShape<O> | undefined> =
  (schema, updater) => (prev) => {
    if (typeof updater !== "function") {
      if (updater === undefined) {
        return undefined;
      }
      if (isMessage(updater, schema.output)) {
        return updater;
      }
      return create(schema.output, updater);
    }
    return create(schema.output, updater(prev));
  };
