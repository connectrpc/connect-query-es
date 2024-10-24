import type {
  DescMessage,
  DescMethod,
  DescMethodUnary,
  DescService,
  MessageInitShape,
  MessageShape,
} from "@bufbuild/protobuf";
import type { ConnectError, Transport } from "@connectrpc/connect";
import type {
  FetchInfiniteQueryOptions as TanstackFetchInfiniteQueryOptions,
  FetchQueryOptions as TanstackFetchQueryOptions,
  InvalidateOptions,
  InvalidateQueryFilters,
  QueryFilters,
  RefetchOptions,
  RefetchQueryFilters,
  ResetOptions,
  SetDataOptions,
  InfiniteData,
  QueryState,
} from "@tanstack/query-core";
import { QueryClient as TSQueryClient } from "@tanstack/query-core";

import type { ConnectQueryKey } from "./connect-query-key.js";
import { createConnectQueryKey } from "./connect-query-key.js";
import type { ConnectInfiniteQueryOptions } from "./create-infinite-query-options.js";
import { createInfiniteQueryOptions } from "./create-infinite-query-options.js";
import { createQueryOptions } from "./create-query-options.js";
import type { ConnectUpdater } from "./utils.js";
import { createProtobufSafeUpdater } from "./utils.js";

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

type KeyParams<Desc extends DescMethod | DescService> =
  Desc extends DescMethodUnary
    ? {
        schema: Desc;
        input?: MessageInitShape<Desc["input"]> | undefined;
        transport: Transport;
        cardinality?: "finite" | "infinite" | undefined;
        pageParamKey?: keyof MessageInitShape<Desc["input"]>;
      }
    : {
        schema: Desc;
        transport: Transport;
        cardinality?: "finite" | "infinite" | undefined;
      };

/**
 * A custom query client that adds some useful methods to access typesafe query data and other shortcuts.
 */
export class QueryClient extends TSQueryClient {
  /**
   * Invalidate and refetch all queries that match the given schema. This
   * can include all queries for a service (and sub methods), or all queries for a method.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientinvalidatequeries}
   */
  public async invalidateConnectQueries<
    Desc extends DescMethod | DescService,
    Params extends KeyParams<Desc>,
  >(
    params: Desc | Params,
    filterOptions?: Omit<InvalidateQueryFilters, "queryKey">,
    options?: InvalidateOptions
  ) {
    if ("schema" in params) {
      return this.invalidateQueries(
        {
          ...filterOptions,
          queryKey: createConnectQueryKey({
            ...params,
            cardinality: params.cardinality,
          }),
        },
        options
      );
    }
    return this.invalidateQueries(
      {
        ...filterOptions,
        queryKey: createConnectQueryKey({
          schema: params as DescMethod,
          cardinality: undefined,
        }),
      },
      options
    );
  }

  /**
   * Refetches all queries that match the given schema. This can include all queries for a service (and sub methods),
   * or all queries for a method.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientrefetchqueries}
   */
  public async refetchConnectQueries<
    Desc extends DescMethod | DescService,
    Params extends KeyParams<Desc>,
  >(
    params: Params,
    filterOptions?: Omit<RefetchQueryFilters, "queryKey">,
    options?: RefetchOptions
  ) {
    return this.refetchQueries(
      {
        ...filterOptions,
        queryKey: createConnectQueryKey({
          ...params,
          cardinality: params.cardinality,
        }),
      },
      options
    );
  }

  /**
   * Set the data for a single query. The query must match exactly the input provided, as well
   * as the transport and cardinality (whether it was a finite or infinite query).
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientsetquerydata}
   */
  public setConnectQueryData<Desc extends DescMethod>(
    keyDescriptor: {
      schema: Desc;
      input?: MessageInitShape<Desc["input"]> | undefined;
      transport: Transport;
      cardinality: "finite" | "infinite";
    },
    updater: ConnectUpdater<Desc["output"]>,

    options?: SetDataOptions | undefined
  ) {
    return this.setQueryData(
      createConnectQueryKey({
        ...keyDescriptor,
        // Since we are matching on the exact input, we match what connect-query does in createQueryOptions
        input: keyDescriptor.input ?? {},
      }),
      createProtobufSafeUpdater<Desc["output"]>(keyDescriptor.schema, updater),
      options
    );
  }

  /**
   * Get the data for a single query. The query must match exactly the input provided, as well
   * as the transport and cardinality (whether it was a finite or infinite query).
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientgetquerydata}
   */
  public getConnectQueryData<Desc extends DescMethod>(keyDescriptor: {
    schema: Desc;
    input?: MessageInitShape<Desc["input"]> | undefined;
    transport: Transport;
    cardinality: "finite";
  }): MessageShape<Desc["output"]>;
  public getConnectQueryData<Desc extends DescMethod>(keyDescriptor: {
    schema: Desc;
    input?: MessageInitShape<Desc["input"]> | undefined;
    transport: Transport;
    cardinality: "infinite";
  }): InfiniteData<MessageShape<Desc["output"]>>;
  public getConnectQueryData<Desc extends DescMethod>(keyDescriptor: {
    schema: Desc;
    input?: MessageInitShape<Desc["input"]> | undefined;
    transport: Transport;
    cardinality: "finite" | "infinite";
  }):
    | MessageShape<Desc["output"]>
    | InfiniteData<MessageShape<Desc["output"]>>
    | undefined {
    const key = createConnectQueryKey({
      ...keyDescriptor,
      // Since we are matching on the exact input, we match what connect-query does in createQueryOptions
      input: keyDescriptor.input ?? {},
    });
    return this.getQueryData(key);
  }

  /**
   * Sets the data for any matching queries for a given method. The input is optional, and anything left
   * as undefined will greedily match queries.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientsetqueriesdata}
   */
  public setConnectQueriesData<Desc extends DescMethod>(
    keyDescriptor: {
      schema: Desc;
      input?: MessageInitShape<Desc["input"]> | undefined;
      transport?: Transport;
      cardinality?: "finite" | "infinite" | undefined;
    },
    updater: ConnectUpdater<Desc["output"]>,
    options?:
      | (SetDataOptions & {
          exact?: boolean;
        })
      | undefined
  ) {
    return this.setQueriesData(
      {
        queryKey: createConnectQueryKey({
          ...keyDescriptor,
          cardinality: keyDescriptor.cardinality,
        }),
        exact: options?.exact ?? false,
      },
      createProtobufSafeUpdater<Desc["output"]>(keyDescriptor.schema, updater),
      options
    );
  }

  /**
   * Fetch a single query and return the result.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientfetchquery}
   */
  public async fetchConnectQuery<
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
    } & FetchQueryOptions<O, SelectOutData>
  ) {
    return this.fetchQuery({
      ...createQueryOptions(schema, input, { transport }),
      ...queryOptions,
    });
  }

  /**
   * Fetch a single infinite query and return the result.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientfetchinfinitequery}
   */
  public async fetchConnectInfiniteQuery<
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
    }: FetchInfiniteQueryOptions<I, O, ParamKey>
  ) {
    return this.fetchInfiniteQuery({
      ...createInfiniteQueryOptions(schema, input, {
        transport,
        pageParamKey,
        getNextPageParam,
      }),
      ...queryOptions,
    });
  }

  /**
   * Prefetch a single query and discard the result.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientprefetchquery}
   */
  public async prefetchConnectQuery<
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
    } & FetchQueryOptions<O, SelectOutData>
  ) {
    return this.prefetchQuery({
      ...createQueryOptions(schema, input, { transport }),
      ...queryOptions,
    });
  }

  /**
   * Prefetch a single infinite query and discard the result.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientprefetchinfinitequery}
   */
  public async prefetchConnectInfiniteQuery<
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
    }: FetchInfiniteQueryOptions<I, O, ParamKey>
  ) {
    return this.prefetchInfiniteQuery({
      ...createInfiniteQueryOptions(schema, input, {
        transport,
        pageParamKey,
        getNextPageParam,
      }),
      ...queryOptions,
    });
  }

  /**
   * Get the query state for a single query. The query must match exactly the input provided, as well
   * as the transport and cardinality (whether it was a finite or infinite query).
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientgetquerystate}
   */
  public getConnectQueryState<Desc extends DescMethodUnary>(keyDescriptor: {
    schema: Desc;
    input?: MessageInitShape<Desc["input"]> | undefined;
    transport: Transport;
    cardinality: "finite";
  }): QueryState<MessageShape<Desc["output"]>, ConnectError>;
  public getConnectQueryState<Desc extends DescMethodUnary>(keyDescriptor: {
    schema: Desc;
    input?: MessageInitShape<Desc["input"]> | undefined;
    transport: Transport;
    cardinality: "infinite";
  }): QueryState<InfiniteData<MessageShape<Desc["output"]>>, ConnectError>;
  public getConnectQueryState<Desc extends DescMethodUnary>(keyDescriptor: {
    schema: Desc;
    input?: MessageInitShape<Desc["input"]> | undefined;
    transport: Transport;
    cardinality: "finite" | "infinite";
  }) {
    return this.getQueryState(createConnectQueryKey(keyDescriptor));
  }

  /**
   * Ensure the query data for a single query. The query must match exactly the input provided, as well
   * as the transport and cardinality (whether it was a finite or infinite query).
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientensurequerydata}
   */
  public async ensureConnectQueryData<
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
    } & FetchQueryOptions<O, SelectOutData>
  ) {
    return this.ensureQueryData({
      ...createQueryOptions(schema, input, { transport }),
      ...queryOptions,
    });
  }

  /**
   * Ensure the query data for a single infinite query. The query must match exactly the input provided, as well
   * as the transport and cardinality (whether it was a finite or infinite query).
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientensureinfinitequerydata}
   */
  public async ensureConnectInfiniteQueryData<
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
    }: FetchInfiniteQueryOptions<I, O, ParamKey>
  ) {
    return this.ensureInfiniteQueryData({
      ...createInfiniteQueryOptions(schema, input, {
        transport,
        pageParamKey,
        getNextPageParam,
      }),
      ...queryOptions,
    });
  }

  /**
   * Get all data entries that match the given schema. This
   * can include all queries for a service (and sub methods), or all queries for a method.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientgetqueriesdata}
   */
  public getConnectQueriesData<
    Desc extends DescMethod | DescService,
    Params extends KeyParams<Desc>,
  >(params: Desc | Params, filterOptions?: Omit<QueryFilters, "queryKey">) {
    if ("schema" in params) {
      return this.getQueriesData({
        ...filterOptions,
        queryKey: createConnectQueryKey({
          ...params,
          cardinality: params.cardinality,
        }),
      });
    }
    return this.getQueriesData({
      ...filterOptions,
      queryKey: createConnectQueryKey({
        schema: params as DescMethod,
        cardinality: undefined,
      }),
    });
  }

  /**
   * Cancels any outgoing queries that match the given schema. This
   * can include all queries for a service (and sub methods), or all queries for a method.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientcancelqueries}
   */
  public async cancelConnectQueries<
    Desc extends DescMethod | DescService,
    Params extends KeyParams<Desc>,
  >(params: Desc | Params, filterOptions?: Omit<QueryFilters, "queryKey">) {
    if ("schema" in params) {
      return this.cancelQueries({
        ...filterOptions,
        queryKey: createConnectQueryKey({
          ...params,
          cardinality: params.cardinality,
        }),
      });
    }
    return this.cancelQueries({
      ...filterOptions,
      queryKey: createConnectQueryKey({
        schema: params as DescMethod,
        cardinality: undefined,
      }),
    });
  }

  /**
   * Removes any queries from the cache that match the given schema. This
   * can include all queries for a service (and sub methods), or all queries for a method.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientremovequeries}
   */
  public removeConnectQueries<
    Desc extends DescMethod | DescService,
    Params extends KeyParams<Desc>,
  >(params: Desc | Params, filterOptions?: Omit<QueryFilters, "queryKey">) {
    if ("schema" in params) {
      this.removeQueries({
        ...filterOptions,
        queryKey: createConnectQueryKey({
          ...params,
          cardinality: params.cardinality,
        }),
      });
      return;
    }
    this.removeQueries({
      ...filterOptions,
      queryKey: createConnectQueryKey({
        schema: params as DescMethod,
        cardinality: undefined,
      }),
    });
    return;
  }

  /**
   * Resets any queries that match the given schema. This
   * can include all queries for a service (and sub methods), or all queries for a method.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientresetqueries}
   */
  public async resetConnectQueries<
    Desc extends DescMethod | DescService,
    Params extends KeyParams<Desc>,
  >(
    params: Desc | Params,
    filterOptions?: Omit<QueryFilters, "queryKey">,
    options?: ResetOptions
  ) {
    if ("schema" in params) {
      return this.resetQueries(
        {
          ...filterOptions,
          queryKey: createConnectQueryKey({
            ...params,
            cardinality: params.cardinality,
          }),
        },
        options
      );
    }
    return this.resetQueries(
      {
        ...filterOptions,
        queryKey: createConnectQueryKey({
          schema: params as DescMethod,
          cardinality: undefined,
        }),
      },
      options
    );
  }
}
