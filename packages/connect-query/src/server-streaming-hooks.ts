// Copyright 2021-2023 Buf Technologies, Inc.
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
  Message,
  MessageType,
  MethodInfoServerStreaming,
  PartialMessage,
  ServiceType,
} from '@bufbuild/protobuf';
import type {
  CallOptions,
  ConnectError,
  StreamResponse,
  Transport,
} from '@connectrpc/connect';
import { createAsyncIterable } from '@connectrpc/connect/protocol';
import {
  type GetNextPageParamFunction,
  type InfiniteData,
  type QueryClient,
  type QueryFunctionContext,
  useQueryClient,
} from '@tanstack/react-query';

import type {
  ConnectPartialQueryKey,
  ConnectQueryKey,
} from './connect-query-key';
import { makeConnectQueryKeyGetter } from './connect-query-key';
import { useTransport } from './use-transport';
import type { DisableQuery } from './utils';
import {
  assert,
  disableQuery,
  isServerStreamingMethod,
  unreachableCase,
} from './utils';

export interface StreamResponseMessage<O> {
  /** List of responses in chronological order */
  responses: O[];
  /** Indicates if the stream is completed or not. */
  done: boolean;
}

/**
 * @see `Updater` from `@tanstack/react-query`
 */
type StreamResponseUpdater<O extends Message<O>> =
  | StreamResponseMessage<PartialMessage<O>>
  | ((
      prev?: StreamResponseMessage<O>,
    ) => StreamResponseMessage<PartialMessage<O>> | undefined);

/**
 * This helper makes sure that the Class for the original data is returned, even if what's provided is a partial message or a plain JavaScript object representing the underlying values.
 */
const protobufStreamMessageSafeUpdater =
  <O extends Message<O>>(
    updater: StreamResponseUpdater<O>,
    Output: MessageType<O>,
  ) =>
  (prev?: StreamResponseMessage<O>): StreamResponseMessage<O> => {
    if (typeof updater === 'function') {
      const next = updater(prev);
      if (next === undefined) {
        // istanbul ignore next -- skipping since this shouldn't ever happen
        return {
          done: prev?.done ?? false,
          responses: [],
        };
      }
      return {
        ...next,
        responses: next.responses.map((response) => new Output(response)),
      };
    }

    return {
      ...updater,
      responses: updater.responses.map((response) => new Output(response)),
    };
  };

type RequireExactlyOne<T, Keys extends keyof T = keyof T> = {
  [K in Keys]-?: Partial<Record<Exclude<Keys, K>, undefined>> &
    Required<Pick<T, K>>;
}[Keys] &
  Pick<T, Exclude<keyof T, Keys>>;

interface BaseInfiniteQueryOptions<
  I extends Message<I>,
  O extends Message<O>,
  ParamKey extends keyof PartialMessage<I>,
> {
  getNextPageParam: (
    lastPage: StreamResponseMessage<O>,
    allPages: StreamResponseMessage<O>[],
  ) => PartialMessage<I>[ParamKey];
  /**
   * The option allows you to remove fields or otherwise customize the input used to generate the query key.
   * By default, we will remove the pageParamKey from the input. If this is provided, we will use this result instead.
   */
  sanitizeInputKey?: (input: PartialMessage<I>) => unknown;
  onError?: (error: ConnectError) => void;
  transport?: Transport | undefined;
  callOptions?: CallOptions | undefined;
}

/**
 * The set of data and hooks that a unary method supports.
 */
export interface ServerStreamingHooks<
  I extends Message<I>,
  O extends Message<O>,
> {
  /**
   * Use this to create a data object that can be used as `placeholderData` or `initialData`.
   */
  createData: (data: PartialMessage<O>) => O;

  /**
   * createUseQueryOptions is intended to be used with `useQuery`, but is not a hook.  Since hooks cannot be called conditionally (or in loops), it can sometimes be helpful to use `createUseQueryOptions` to prepare an input to TanStack's `useQuery` API.
   *
   * The caveat being that if you go the route of using `createUseQueryOptions` you must provide transport.  You can get transport from the `useTransport` export.  If you cannot use hooks to retrieve transport, then look at the documentation for `TransportProvider` to learn more about how to use Connect-Web's createConnectTransport` or `createGrpcWebTransport`APIs.
   */
  createUseQueryOptions: (
    input: DisableQuery | PartialMessage<I> | undefined,
    options: {
      getPlaceholderData?: (enabled: boolean) => PartialMessage<O> | undefined;

      onError?: (error: ConnectError) => void;
      transport: Transport;
      callOptions?: CallOptions | undefined;
      /**
       * Required to update cache as request is completed. If not provided,
       * everything will be aggregated and grouped into a single response at the
       * end.
       */
      queryClient?: QueryClient;
      /** Indicates if this query is being made for useInfiniteQuery. */
      isInfiniteQuery?: boolean;
    },
  ) => {
    enabled: boolean;
    queryKey: ConnectQueryKey<I>;
    queryFn: (
      context?: QueryFunctionContext<ConnectQueryKey<I>>,
    ) => Promise<StreamResponseMessage<O>>;
    placeholderData?: () => StreamResponseMessage<O> | undefined;
    onError?: (error: ConnectError) => void;
  };

  /**
   * This helper is useful for getting query keys matching a wider set of queries associated to this Connect `Service`, per TanStack Query's partial matching mechanism.
   */
  getPartialQueryKey: () => ConnectPartialQueryKey;

  /**
   * This helper is useful to manually compute the `queryKey` sent to TanStack Query.  Otherwise, this has no side effects.
   */
  getQueryKey: (input?: DisableQuery | PartialMessage<I>) => ConnectQueryKey<I>;

  /**
   * This is the metadata associated with this method.
   */
  methodInfo: MethodInfoServerStreaming<I, O>;

  /**
   *
   * This helper is intended to be used with `QueryClient`s `setQueryData` function.
   */
  setQueryData: (
    updater: StreamResponseUpdater<O>,
    input?: PartialMessage<I>,
  ) => [
    queryKey: ConnectQueryKey<I>,
    updater: (
      prev?: StreamResponseMessage<O>,
    ) => StreamResponseMessage<O> | undefined,
  ];

  /**
   * This helper is intended to be used with `QueryClient`s `setQueriesData` function.
   */
  setQueriesData: (
    updater: StreamResponseUpdater<O>,
  ) => [
    queryKey: ConnectPartialQueryKey,
    updater: (
      prev?: StreamResponseMessage<O>,
    ) => StreamResponseMessage<O> | undefined,
  ];

  /**
   * This helper is intended to be used with `QueryClient`s `useInfiniteQuery` function.
   */
  useInfiniteQuery: <ParamKey extends keyof PartialMessage<I>>(
    input: DisableQuery | PartialMessage<I>,
    options: BaseInfiniteQueryOptions<I, O, ParamKey> &
      RequireExactlyOne<{
        applyPageParam: (options: {
          pageParam: PartialMessage<I>[ParamKey] | undefined;
          input: PartialMessage<I>;
        }) => PartialMessage<I>;
        pageParamKey: ParamKey;
      }>,
  ) => {
    enabled: boolean;
    queryKey: ConnectQueryKey<I>;
    queryFn: (
      context: QueryFunctionContext<
        ConnectQueryKey<I>,
        PartialMessage<I>[ParamKey]
      >,
    ) => Promise<StreamResponseMessage<O>>;
    getNextPageParam: GetNextPageParamFunction<StreamResponseMessage<O>>;
    onError?: (error: ConnectError) => void;
  };

  /**
   * This function is intended to be used with TanStack Query's `useMutation` API.
   */
  useMutation: (options?: {
    onError?: (error: ConnectError) => void;
    transport?: Transport | undefined;
    callOptions?: CallOptions | undefined;
  }) => {
    mutationFn: (
      input: PartialMessage<I>,
      context?: QueryFunctionContext<ConnectQueryKey<I>>,
    ) => Promise<StreamResponseMessage<O>>;
    onError?: (error: ConnectError) => void;
  };

  /**
   * This function is intended to be used with Tanstack Query's `useQuery` API.
   */
  useQuery: (
    input?: DisableQuery | PartialMessage<I>,
    options?: {
      getPlaceholderData?: (enabled: boolean) => PartialMessage<O> | undefined;

      onError?: (error: ConnectError) => void;
      transport?: Transport | undefined;
      callOptions?: CallOptions | undefined;
    },
  ) => {
    enabled: boolean;
    queryKey: ConnectQueryKey<I>;
    queryFn: (
      context?: QueryFunctionContext<ConnectQueryKey<I>>,
    ) => Promise<StreamResponseMessage<O>>;
    placeholderData?: () => StreamResponseMessage<O> | undefined;
    onError?: (error: ConnectError) => void;
  };
}

function handleStreamResponse<I extends Message<I>, O extends Message<O>>(
  stream: Promise<StreamResponse<I, O>>,
  options?: CallOptions,
): AsyncIterable<O> {
  const it = (async function* () {
    const response = await stream;
    options?.onHeader?.(response.header);
    yield* response.message;
    options?.onTrailer?.(response.trailer);
  })()[Symbol.asyncIterator]();
  // Create a new iterable to omit throw/return.
  return {
    [Symbol.asyncIterator]: () => ({
      // eslint-disable-next-line @typescript-eslint/promise-function-async -- not necessary to declare async
      next: () => it.next(),
    }),
  };
}

/**
 * A helper function that will configure the set of hooks a Unary method supports.
 */
export const serverStreamingHooks = <
  I extends Message<I>,
  O extends Message<O>,
>({
  methodInfo,
  typeName,
  transport: topLevelCustomTransport,
}: {
  methodInfo: MethodInfoServerStreaming<I, O>;
  typeName: ServiceType['typeName'];
  transport?: Transport | undefined;
}): ServerStreamingHooks<I, O> => {
  // istanbul ignore next
  if (!isServerStreamingMethod(methodInfo)) {
    throw unreachableCase(
      methodInfo,
      `serverStreamingHooks was passed a non server-streaming method, ${
        (methodInfo as { name: string }).name
      }`,
    );
  }

  const getQueryKey = makeConnectQueryKeyGetter(typeName, methodInfo.name);

  const createUseQueryOptions: ServerStreamingHooks<
    I,
    O
  >['createUseQueryOptions'] = (
    input,
    {
      callOptions,
      getPlaceholderData,
      onError,
      transport,
      queryClient,
      isInfiniteQuery = false,
    },
  ) => {
    const enabled = input !== disableQuery;

    assert(
      transport !== undefined, // eslint-disable-line @typescript-eslint/no-unnecessary-condition -- yes, it's true that according to the types it should not be possible for a user to pass `undefined` for transport, but it's much nicer to catch them here if they do (as in, without TypeScript or in a insufficiently sound TypeScript configuration).
      'createUseQueryOptions requires you to provide a Transport.  If you want automatic inference of Transport, try using the useQuery helper.',
    );

    return {
      enabled,

      ...(getPlaceholderData
        ? {
            placeholderData: () => {
              const placeholderData = getPlaceholderData(enabled);
              // istanbul ignore next
              if (placeholderData === undefined) {
                return undefined;
              }
              return {
                done: false,
                responses: [new methodInfo.O(placeholderData)],
              };
            },
          }
        : {}),

      queryFn: async (context) => {
        assert(enabled, 'queryFn does not accept a disabled query');
        const currentPageParam = context?.pageParam as unknown;
        const queryKey = context?.queryKey ?? getQueryKey(input);
        let responses: O[] = [];
        for await (const response of handleStreamResponse(
          transport.stream<I, O>(
            {
              typeName,
              methods: {},
            },
            methodInfo,
            (callOptions ?? context)?.signal,
            callOptions?.timeoutMs,
            callOptions?.headers,
            createAsyncIterable([input ?? {}]),
          ),
        )) {
          // Spreading results to keep referential integrity for changes
          responses = [...responses, response];
          const newData: StreamResponseMessage<O> = {
            done: false,
            responses,
          };
          if (isInfiniteQuery) {
            // this is an infinite query so update accordingly
            queryClient?.setQueriesData(
              queryKey,
              (prev?: InfiniteData<StreamResponseMessage<O>>) => {
                if (prev === undefined) {
                  return {
                    pages: [newData],
                    pageParams: [currentPageParam],
                  };
                }
                const pageIndex = prev.pageParams.findIndex(
                  (pageParam) => pageParam === currentPageParam,
                );
                if (pageIndex === -1) {
                  return {
                    pages: [...prev.pages, newData],
                    pageParams: [...prev.pageParams, currentPageParam],
                  };
                }
                const pages = [...prev.pages];
                pages[pageIndex] = newData;
                return {
                  pages,
                  pageParams: prev.pageParams,
                };
              },
            );
          } else {
            queryClient?.setQueriesData(queryKey, newData);
          }
        }
        return {
          done: true,
          responses,
        } satisfies StreamResponseMessage<O>;
      },

      queryKey: getQueryKey(input),

      ...(onError ? { onError } : {}),
    };
  };

  return {
    createData: (input) => new methodInfo.O(input),

    createUseQueryOptions,

    getPartialQueryKey: () => [typeName, methodInfo.name],

    getQueryKey,

    methodInfo,

    setQueriesData: (updater) => [
      [typeName, methodInfo.name],
      protobufStreamMessageSafeUpdater(updater, methodInfo.O),
    ],

    setQueryData: (updater, input) => [
      getQueryKey(input),
      protobufStreamMessageSafeUpdater(updater, methodInfo.O),
    ],

    useInfiniteQuery: (
      input,
      {
        transport: optionsTransport,
        getNextPageParam,
        onError,
        callOptions,
        sanitizeInputKey,
        ...otherOptions
      },
    ) => {
      const contextTransport = useTransport();
      const queryClient = useQueryClient();
      const transport =
        optionsTransport ?? topLevelCustomTransport ?? contextTransport;

      const enabled = input !== disableQuery;
      let sanitizedInput = input;

      if (enabled) {
        sanitizedInput =
          'pageParamKey' in otherOptions &&
          otherOptions.pageParamKey !== undefined
            ? {
                ...input,
                [otherOptions.pageParamKey]: undefined,
              }
            : sanitizeInputKey?.(input) ?? input;
      }

      return {
        enabled,

        getNextPageParam,

        queryFn: async (context) => {
          assert(
            input !== disableQuery,
            'queryFn does not accept a disabled query',
          );
          const valueAtPageParam =
            'pageParamKey' in otherOptions &&
            otherOptions.pageParamKey !== undefined
              ? input[otherOptions.pageParamKey]
              : undefined;
          const inputCombinedWithPageParam =
            'applyPageParam' in otherOptions &&
            otherOptions.applyPageParam !== undefined
              ? otherOptions.applyPageParam({
                  pageParam: context.pageParam,
                  input,
                })
              : {
                  ...input,
                  [otherOptions.pageParamKey]:
                    context.pageParam ?? valueAtPageParam,
                };
          return createUseQueryOptions(inputCombinedWithPageParam, {
            transport,
            queryClient,
            callOptions,
            isInfiniteQuery: true,
          }).queryFn(context);
        },

        queryKey: getQueryKey(sanitizedInput),

        ...(onError ? { onError } : {}),
      };
    },

    useMutation: ({
      transport: optionsTransport,
      callOptions,
      onError,
    } = {}) => {
      const contextTransport = useTransport();
      const transport =
        optionsTransport ?? topLevelCustomTransport ?? contextTransport;

      return {
        mutationFn: async (input, context) => {
          return createUseQueryOptions(input, {
            transport,
            callOptions,
          }).queryFn(context);
        },
        ...(onError ? { onError } : {}),
      };
    },

    useQuery: (input, options = {}) => {
      const contextTransport = useTransport();
      const queryClient = useQueryClient();
      const transport =
        options.transport ?? topLevelCustomTransport ?? contextTransport;

      return createUseQueryOptions(input, {
        ...options,
        transport,
        queryClient,
      });
    },
  };
};
