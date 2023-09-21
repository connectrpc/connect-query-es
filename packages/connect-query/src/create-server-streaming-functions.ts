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
  Message,
  MessageType,
  MethodInfoServerStreaming,
  PartialMessage,
  ServiceType,
} from "@bufbuild/protobuf";
import type {
  CallOptions,
  ConnectError,
  StreamResponse,
  Transport,
} from "@connectrpc/connect";
import { createAsyncIterable } from "@connectrpc/connect/protocol";
import type { QueryClient, QueryFunctionContext } from "@tanstack/react-query";

import type {
  ConnectPartialQueryKey,
  ConnectQueryKey,
} from "./connect-query-key";
import { makeConnectQueryKeyGetter } from "./connect-query-key";
import type { DisableQuery } from "./utils";
import {
  assert,
  disableQuery,
  isServerStreamingMethod,
  unreachableCase,
} from "./utils";

/**
 *
 */
export type StreamResponseMessage<O> = O[];

/**
 * This helper makes sure that the Class for the original data is returned, even if what's provided is a partial message or a plain JavaScript object representing the underlying values.
 */
const protobufStreamMessageSafeUpdater =
  <O extends Message<O>>(
    updater:
      | StreamResponseMessage<PartialMessage<O>>
      | ((
          prev?: StreamResponseMessage<O>,
        ) => StreamResponseMessage<PartialMessage<O>>),
    Output: MessageType<O>,
  ) =>
  (prev?: StreamResponseMessage<O>): StreamResponseMessage<O> => {
    if (typeof updater === "function") {
      const next = updater(prev);
      return next.map((response) => new Output(response));
    }

    return updater.map((response) => new Output(response));
  };

/**
 * The set of data and hooks that a unary method supports.
 */
export interface ServerStreamingFunctions<
  I extends Message<I>,
  O extends Message<O>,
> {
  /**
   * Use this to create a data object that can be used as `placeholderData` or `initialData`.
   */
  createData: (
    data: StreamResponseMessage<PartialMessage<O>>,
  ) => StreamResponseMessage<O>;

  /**
   * createUseQueryOptions is intended to be used with `useQuery`, but is not a hook.  Since hooks cannot be called conditionally (or in loops), it can sometimes be helpful to use `createUseQueryOptions` to prepare an input to TanStack's `useQuery` API.
   *
   * This API also disables a few automatic refresh options by default (refetchOnWindowFocus, refetchOnMount, and refetchOnReconnect) since they make less
   * sense in a streaming context. They can be reenabled by overriding them.
   *
   * The caveat being that if you go the route of using `createUseQueryOptions` you must provide transport.  You can get transport from the `useTransport` export.  If you cannot use hooks to retrieve transport, then look at the documentation for `TransportProvider` to learn more about how to use Connect-Web's createConnectTransport` or `createGrpcWebTransport`APIs.
   */
  createUseQueryOptions: (
    input: DisableQuery | PartialMessage<I> | undefined,
    options: {
      getPlaceholderData?: (
        enabled: boolean,
      ) => StreamResponseMessage<PartialMessage<O>> | undefined;

      onError?: (error: ConnectError) => void;
      transport?: Transport;
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
    refetchOnWindowFocus: false;
    refetchOnMount: false;
    refetchOnReconnect: false;
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
    updater:
      | StreamResponseMessage<PartialMessage<O>>
      | ((
          prev?: StreamResponseMessage<O>,
        ) => StreamResponseMessage<PartialMessage<O>>),
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
    updater:
      | StreamResponseMessage<PartialMessage<O>>
      | ((
          prev?: StreamResponseMessage<O>,
        ) => StreamResponseMessage<PartialMessage<O>>),
  ) => [
    queryKey: ConnectPartialQueryKey,
    updater: (
      prev?: StreamResponseMessage<O>,
    ) => StreamResponseMessage<O> | undefined,
  ];

  /**
   * This function is intended to be used with TanStack Query's `useMutation` API.
   */
  createUseMutationOptions: (options?: {
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
export const createServerStreamingFunctions = <
  I extends Message<I>,
  O extends Message<O>,
>({
  methodInfo,
  typeName,
  transport: topLevelCustomTransport,
}: {
  methodInfo: MethodInfoServerStreaming<I, O>;
  typeName: ServiceType["typeName"];
  transport?: Transport | undefined;
}): ServerStreamingFunctions<I, O> => {
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

  const createUseQueryOptions: ServerStreamingFunctions<
    I,
    O
  >["createUseQueryOptions"] = (
    input,
    { callOptions, getPlaceholderData, onError, transport, queryClient },
  ) => {
    const enabled = input !== disableQuery;

    assert(
      transport !== undefined,
      "createUseQueryOptions requires you to provide a Transport.  If you want automatic inference of Transport, try using the useQuery helper.",
    );

    return {
      enabled,

      ...(getPlaceholderData
        ? {
            placeholderData: () => {
              return getPlaceholderData(enabled)?.map((i) => {
                return new methodInfo.O(i);
              });
            },
          }
        : {}),

      queryFn: async (context) => {
        assert(enabled, "queryFn does not accept a disabled query");
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
          // Spreading results to break referential integrity for changes
          responses = [...responses, response];

          queryClient?.setQueriesData(queryKey, responses);
        }
        return responses satisfies StreamResponseMessage<O>;
      },

      queryKey: getQueryKey(input),

      ...(onError ? { onError } : {}),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    };
  };

  function getPartialQueryKey(): ConnectPartialQueryKey {
    return [typeName, methodInfo.name];
  }

  return {
    createData: (input) => input.map((item) => new methodInfo.O(item)),

    createUseQueryOptions,

    getPartialQueryKey,

    getQueryKey,

    methodInfo,

    setQueriesData: (updater) => [
      getPartialQueryKey(),
      protobufStreamMessageSafeUpdater(updater, methodInfo.O),
    ],

    setQueryData: (updater, input) => [
      getQueryKey(input),
      protobufStreamMessageSafeUpdater(updater, methodInfo.O),
    ],

    createUseMutationOptions: ({
      transport: optionsTransport,
      callOptions,
      onError,
    } = {}) => {
      const transport = optionsTransport ?? topLevelCustomTransport;
      assert(
        transport !== undefined,
        "createUseMutationOptions requires you to provide a Transport.",
      );
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
  };
};
