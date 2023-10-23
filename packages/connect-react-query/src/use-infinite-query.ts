import type { Message, PartialMessage } from "@bufbuild/protobuf";
import type { CallOptions, ConnectError, Transport } from "@connectrpc/connect";
import type {
  GetNextPageParamFunction,
  InfiniteData,
  UseInfiniteQueryOptions as TSUseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseSuspenseInfiniteQueryOptions as TSUseSuspenseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryResult,
} from "@tanstack/react-query";
import {
  useInfiniteQuery as tsUseInfiniteQuery,
  useSuspenseInfiniteQuery as tsUseSuspenseInfiniteQuery,
} from "@tanstack/react-query";

import type { ConnectQueryKey } from "./connect-query-key";
import { createConnectQueryKey } from "./connect-query-key";
import { createUnaryInfiniteQueryFn } from "./create-unary-infinite-query-fn";
import type { MethodUnaryDescriptor } from "./method-unary-descriptor";
import { useTransport } from "./use-transport";
import type { DisableQuery } from "./utils";
import { disableQuery } from "./utils";

/**
 * Options for useInfiniteQuery
 */
export interface UseInfiniteQueryConnectOptions<
  I extends Message<I>,
  O extends Message<O>,
  ParamKey extends keyof PartialMessage<I>,
> {
  /** Defines which part of the input should be considered the page param */
  pageParamKey: ParamKey;
  /** Transport can be overridden here.*/
  transport?: Transport;
  /** Additional call options */
  callOptions?: Omit<CallOptions, "signal"> | undefined;
  /** Determines the next page. */
  getNextPageParam: GetNextPageParamFunction<PartialMessage<I>[ParamKey], O>;
}

/**
 * Options for useInfiniteQuery
 */
export type UseInfiniteQueryOptions<
  I extends Message<I>,
  O extends Message<O>,
  ParamKey extends keyof PartialMessage<I>,
> = Omit<
  TSUseInfiniteQueryOptions<
    O,
    ConnectError,
    InfiniteData<O>,
    O,
    ConnectQueryKey<I>,
    PartialMessage<I>[ParamKey]
  >,
  "getNextPageParam" | "initialPageParam" | "queryFn" | "queryKey"
> &
  UseInfiniteQueryConnectOptions<I, O, ParamKey>;

/**
 * Query the method provided. Maps to useQuery on tanstack/react-query
 *
 * @param methodSig
 * @returns
 */
export function useInfiniteQuery<
  I extends Message<I>,
  O extends Message<O>,
  ParamKey extends keyof PartialMessage<I>,
  Input extends PartialMessage<I> & Required<Pick<PartialMessage<I>, ParamKey>>,
>(
  methodSig: MethodUnaryDescriptor<I, O>,
  input: DisableQuery | Input,
  {
    transport,
    getNextPageParam,
    pageParamKey,
    callOptions,
    ...queryOptions
  }: UseInfiniteQueryOptions<I, O, ParamKey>
): UseInfiniteQueryResult<InfiniteData<O>, ConnectError> {
  const transportFromCtx = useTransport();

  const enabled = input !== disableQuery && queryOptions.enabled !== false;
  const sanitizedInput: DisableQuery | PartialMessage<I> =
    input === disableQuery
      ? disableQuery
      : {
          ...input,
          [pageParamKey]: undefined,
        };

  const queryKey = createConnectQueryKey(methodSig, sanitizedInput);
  return tsUseInfiniteQuery({
    ...queryOptions,
    getNextPageParam,
    initialPageParam: enabled
      ? (input[pageParamKey] as PartialMessage<I>[ParamKey])
      : undefined,
    queryKey,
    enabled,
    queryFn: createUnaryInfiniteQueryFn(methodSig, sanitizedInput, {
      transport: transport ?? transportFromCtx,
      callOptions,
      pageParamKey,
    }),
  });
}

/**
 * Options for useInfiniteQuery
 */
export type UseSuspenseInfiniteQueryOptions<
  I extends Message<I>,
  O extends Message<O>,
  ParamKey extends keyof PartialMessage<I>,
> = Omit<
  TSUseSuspenseInfiniteQueryOptions<
    O,
    ConnectError,
    InfiniteData<O>,
    O,
    ConnectQueryKey<I>,
    PartialMessage<I>[ParamKey]
  >,
  "getNextPageParam" | "initialPageParam" | "queryFn" | "queryKey"
> &
  UseInfiniteQueryConnectOptions<I, O, ParamKey>;

/**
 * Query the method provided. Maps to useSuspenseInfiniteQuery on tanstack/react-query
 *
 * @param methodSig
 * @returns
 */
export function useSuspenseInfiniteQuery<
  I extends Message<I>,
  O extends Message<O>,
  ParamKey extends keyof PartialMessage<I>,
  Input extends PartialMessage<I> & Required<Pick<PartialMessage<I>, ParamKey>>,
>(
  methodSig: MethodUnaryDescriptor<I, O>,
  input: Input,
  {
    transport,
    getNextPageParam,
    pageParamKey,
    callOptions,
    ...queryOptions
  }: UseSuspenseInfiniteQueryOptions<I, O, ParamKey>
): UseSuspenseInfiniteQueryResult<InfiniteData<O>, ConnectError> {
  const transportFromCtx = useTransport();

  const sanitizedInput: PartialMessage<I> = {
    ...input,
    [pageParamKey]: undefined,
  };

  const queryKey = createConnectQueryKey(methodSig, sanitizedInput);
  return tsUseSuspenseInfiniteQuery({
    ...queryOptions,
    getNextPageParam,
    initialPageParam: input[pageParamKey] as PartialMessage<I>[ParamKey],
    queryKey,
    queryFn: createUnaryInfiniteQueryFn(methodSig, sanitizedInput, {
      transport: transport ?? transportFromCtx,
      callOptions,
      pageParamKey,
    }),
  });
}
