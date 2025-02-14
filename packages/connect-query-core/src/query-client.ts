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
} from "@tanstack/query-core";
import { QueryClient as TSQueryClient } from "@tanstack/query-core";

import type { ConnectQueryKey } from "./connect-query-key.js";
import { createConnectQueryKey } from "./connect-query-key.js";
import type { ConnectInfiniteQueryOptions } from "./create-infinite-query-options.js";
import { createInfiniteQueryOptions } from "./create-infinite-query-options.js";
import { createQueryOptions } from "./create-query-options.js";
import type { ConnectInfiniteUpdater, ConnectUpdater } from "./utils.js";
import {
  createProtobufSafeInfiniteUpdater,
  createProtobufSafeUpdater,
} from "./utils.js";

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
export class QueryClient extends TSQueryClient {
  /**
   * Invalidate and refetch all queries that match the given schema. This
   * can include all queries for a service (and sub methods), or all queries for a method.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientinvalidatequeries}
   */
  public async invalidateConnectQueries<
    I extends DescMessage,
    O extends DescMessage,
    Desc extends DescService,
  >(
    params:
      | KeyParamsForMethod<DescMethodUnary<I, O>>
      | KeyParamsForService<Desc>,
    filterOptions?: Omit<InvalidateQueryFilters, "queryKey">,
    options?: InvalidateOptions
  ) {
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

  /**
   * Refetch all queries that match the given schema. This can include all queries for a service (and sub methods),
   * or all queries for a method.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientrefetchqueries}
   */
  public async refetchConnectQueries<
    I extends DescMessage,
    O extends DescMessage,
    Desc extends DescService,
  >(
    params:
      | KeyParamsForMethod<DescMethodUnary<I, O>>
      | KeyParamsForService<Desc>,
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
  public setConnectQueryData<I extends DescMessage, O extends DescMessage>(
    keyDescriptor: {
      schema: DescMethodUnary<I, O>;
      input?: MessageInitShape<I>;
      transport: Transport;
      cardinality: "infinite";
    },
    updater: ConnectInfiniteUpdater<O>,
    options?: SetDataOptions
  ): O;
  public setConnectQueryData<I extends DescMessage, O extends DescMessage>(
    keyDescriptor: {
      schema: DescMethodUnary<I, O>;
      input?: MessageInitShape<I>;
      transport: Transport;
      cardinality: "finite";
    },
    updater: ConnectUpdater<O>,
    options?: SetDataOptions
  ): O;
  public setConnectQueryData<I extends DescMessage, O extends DescMessage>(
    keyDescriptor: {
      schema: DescMethodUnary<I, O>;
      input?: MessageInitShape<I>;
      transport: Transport;
      cardinality: "finite" | "infinite";
    },
    updater: ConnectUpdater<O> | ConnectInfiniteUpdater<O>,

    options?: SetDataOptions
  ) {
    return this.setQueryData(
      createConnectQueryKey({
        ...keyDescriptor,
        // Since we are matching on the exact input, we match what connect-query does in createQueryOptions
        input: keyDescriptor.input ?? ({} as MessageInitShape<I>),
      }),
      keyDescriptor.cardinality === "finite"
        ? createProtobufSafeUpdater<O>(
            keyDescriptor.schema,
            updater as ConnectUpdater<O>
          )
        : createProtobufSafeInfiniteUpdater<O>(
            keyDescriptor.schema,
            updater as ConnectInfiniteUpdater<O>
          ),
      options
    );
  }

  /**
   * Get the data for a single query. The query must match exactly the input provided, as well
   * as the transport and cardinality (whether it was a finite or infinite query).
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientgetquerydata}
   */
  public getConnectQueryData<
    I extends DescMessage,
    O extends DescMessage,
  >(keyDescriptor: {
    schema: DescMethodUnary<I, O>;
    input?: MessageInitShape<I>;
    transport: Transport;
    cardinality: "finite";
  }): MessageShape<O>;
  public getConnectQueryData<
    I extends DescMessage,
    O extends DescMessage,
  >(keyDescriptor: {
    schema: DescMethodUnary<I, O>;
    input?: MessageInitShape<I>;
    transport: Transport;
    cardinality: "infinite";
  }): InfiniteData<MessageShape<O>>;
  public getConnectQueryData<
    I extends DescMessage,
    O extends DescMessage,
  >(keyDescriptor: {
    schema: DescMethodUnary<I, O>;
    input?: MessageInitShape<I>;
    transport: Transport;
    cardinality: "finite" | "infinite";
  }): MessageShape<O> | InfiniteData<MessageShape<O>> | undefined {
    return this.getQueryData(createConnectQueryKey(keyDescriptor));
  }

  /**
   * Sets the data for any matching queries for a given method. The input is optional, and anything left
   * as undefined will greedily match queries.
   *
   * @see {@link https://tanstack.com/query/latest/docs/reference/QueryClient/#queryclientsetqueriesdata}
   */
  public setConnectQueriesData<I extends DescMessage, O extends DescMessage>(
    keyDescriptor: {
      schema: DescMethodUnary<I, O>;
      input?: MessageInitShape<I>;
      transport?: Transport;
      cardinality: "finite";
    },
    updater: ConnectUpdater<O>,
    options?: SetDataOptions & {
      exact?: boolean;
    }
  ): [readonly unknown[], unknown][];
  public setConnectQueriesData<I extends DescMessage, O extends DescMessage>(
    keyDescriptor: {
      schema: DescMethodUnary<I, O>;
      input?: MessageInitShape<I>;
      transport?: Transport;
      cardinality: "infinite";
    },
    updater: ConnectInfiniteUpdater<O>,
    options?: SetDataOptions & {
      exact?: boolean;
    }
  ): [readonly unknown[], unknown][];
  public setConnectQueriesData<I extends DescMessage, O extends DescMessage>(
    keyDescriptor: {
      schema: DescMethodUnary<I, O>;
      input?: MessageInitShape<I>;
      transport?: Transport;
      cardinality: "finite" | "infinite";
    },
    updater: ConnectUpdater<O> | ConnectInfiniteUpdater<O>,
    options?: SetDataOptions & {
      exact?: boolean;
    }
  ) {
    return this.setQueriesData(
      {
        queryKey: createConnectQueryKey({
          ...keyDescriptor,
          cardinality: keyDescriptor.cardinality,
        }),
        exact: options?.exact ?? false,
      },
      keyDescriptor.cardinality === "finite"
        ? createProtobufSafeUpdater<O>(
            keyDescriptor.schema,
            updater as ConnectUpdater<O>
          )
        : createProtobufSafeInfiniteUpdater<O>(
            keyDescriptor.schema,
            updater as ConnectInfiniteUpdater<O>
          ),
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
    input?: MessageInitShape<Desc["input"]>;
    transport: Transport;
    cardinality: "finite";
  }): QueryState<MessageShape<Desc["output"]>, ConnectError>;
  public getConnectQueryState<Desc extends DescMethodUnary>(keyDescriptor: {
    schema: Desc;
    input?: MessageInitShape<Desc["input"]>;
    transport: Transport;
    cardinality: "infinite";
  }): QueryState<InfiniteData<MessageShape<Desc["output"]>>, ConnectError>;
  public getConnectQueryState<Desc extends DescMethodUnary>(keyDescriptor: {
    schema: Desc;
    input?: MessageInitShape<Desc["input"]>;
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
    I extends DescMessage,
    O extends DescMessage,
    Desc extends DescService,
  >(
    params:
      | KeyParamsForMethod<DescMethodUnary<I, O>>
      | KeyParamsForService<Desc>,
    filterOptions?: Omit<QueryFilters, "queryKey">
  ) {
    return this.getQueriesData({
      ...filterOptions,
      queryKey: createConnectQueryKey({
        ...params,
        cardinality: params.cardinality,
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
    I extends DescMessage,
    O extends DescMessage,
    Desc extends DescService,
  >(
    params:
      | KeyParamsForMethod<DescMethodUnary<I, O>>
      | KeyParamsForService<Desc>,
    filterOptions?: Omit<QueryFilters, "queryKey">
  ) {
    return this.cancelQueries({
      ...filterOptions,
      queryKey: createConnectQueryKey({
        ...params,
        cardinality: params.cardinality,
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
    I extends DescMessage,
    O extends DescMessage,
    Desc extends DescService,
  >(
    params:
      | KeyParamsForMethod<DescMethodUnary<I, O>>
      | KeyParamsForService<Desc>,
    filterOptions?: Omit<QueryFilters, "queryKey">
  ) {
    this.removeQueries({
      ...filterOptions,
      queryKey: createConnectQueryKey({
        ...params,
        cardinality: params.cardinality,
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
    I extends DescMessage,
    O extends DescMessage,
    Desc extends DescService,
  >(
    params:
      | KeyParamsForMethod<DescMethodUnary<I, O>>
      | KeyParamsForService<Desc>,
    filterOptions?: Omit<QueryFilters, "queryKey">,
    options?: ResetOptions
  ) {
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
}
