import type { Message, PartialMessage } from "@bufbuild/protobuf";
import type { CallOptions, ConnectError, Transport } from "@connectrpc/connect";
import type {
  UseQueryOptions as TSUseQueryOptions,
  UseQueryResult,
  UseSuspenseQueryOptions as TSUseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from "@tanstack/react-query";
import {
  useQuery as tsUseQuery,
  useSuspenseQuery as tsUseSuspenseQuery,
} from "@tanstack/react-query";

import type { ConnectQueryKey } from "./connect-query-key";
import { createConnectQueryKey } from "./connect-query-key";
import { createUnaryQueryFn } from "./create-unary-query-fn";
import type { MethodUnaryDescriptor } from "./method-unary-descriptor";
import { useTransport } from "./use-transport";
import type { DisableQuery } from "./utils";
import { disableQuery } from "./utils";

interface ConnectQueryOptions {
  transport?: Transport;
  callOptions?: Omit<CallOptions, "signal"> | undefined;
}

/**
 * Options for useQuery
 */
export type UseQueryOptions<
  I extends Message<I>,
  O extends Message<O>,
> = ConnectQueryOptions &
  Omit<
    TSUseQueryOptions<O, ConnectError, O, ConnectQueryKey<I>>,
    "queryFn" | "queryKey"
  >;

/**
 * Query the method provided. Maps to useQuery on tanstack/react-query
 *
 * @param methodSig
 * @returns
 */
export function useQuery<I extends Message<I>, O extends Message<O>>(
  methodSig: MethodUnaryDescriptor<I, O>,
  input: DisableQuery | PartialMessage<I> | undefined,
  { transport, callOptions, ...queryOptions }: UseQueryOptions<I, O> = {}
): UseQueryResult<O, ConnectError> {
  const queryKey = createConnectQueryKey(methodSig, input);
  const transportFromCtx = useTransport();
  return tsUseQuery({
    ...queryOptions,
    queryKey,
    enabled: input !== disableQuery && queryOptions.enabled !== false,
    queryFn: createUnaryQueryFn(methodSig, input, {
      transport: transport ?? transportFromCtx,
      callOptions,
    }),
  });
}

/**
 * Options for useQuery
 */
export type UseSuspenseQueryOptions<
  I extends Message<I>,
  O extends Message<O>,
> = ConnectQueryOptions &
  Omit<
    TSUseSuspenseQueryOptions<O, ConnectError, O, ConnectQueryKey<I>>,
    "queryFn" | "queryKey"
  >;

/**
 * Query the method provided. Maps to useSuspenseQuery on tanstack/react-query
 *
 * @param methodSig
 * @returns
 */
export function useSuspenseQuery<I extends Message<I>, O extends Message<O>>(
  methodSig: MethodUnaryDescriptor<I, O>,
  input: PartialMessage<I> | undefined,
  {
    transport,
    callOptions,
    ...queryOptions
  }: UseSuspenseQueryOptions<I, O> = {}
): UseSuspenseQueryResult<O, ConnectError> {
  const queryKey = createConnectQueryKey(methodSig, input);
  const transportFromCtx = useTransport();
  return tsUseSuspenseQuery({
    ...queryOptions,
    queryKey,
    queryFn: createUnaryQueryFn(methodSig, input, {
      transport: transport ?? transportFromCtx,
      callOptions,
    }),
  });
}
