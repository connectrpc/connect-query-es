import type { Message, PartialMessage } from "@bufbuild/protobuf";
import type { CallOptions, ConnectError, Transport } from "@connectrpc/connect";
import type {
  UseQueryOptions as TSUseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { useQuery as tsUseQuery } from "@tanstack/react-query";

import type { ConnectQueryKey } from "./connect-query-key";
import { createConnectQueryKey } from "./connect-query-key";
import { createUnaryQueryFn } from "./create-unary-query-fn";
import type { MethodUnaryDescriptor } from "./method-unary-descriptor";
import { useTransport } from "./use-transport";
import type { DisableQuery } from "./utils";
import { disableQuery } from "./utils";

/**
 * Options for useQuery
 */
export type UseQueryOptions<I extends Message<I>, O extends Message<O>> = Omit<
  TSUseQueryOptions<O, ConnectError, O, ConnectQueryKey<I>>,
  "queryFn" | "queryKey"
> & {
  transport?: Transport;
  callOptions?: Omit<CallOptions, "signal"> | undefined;
};

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
