import type { Message, PartialMessage } from "@bufbuild/protobuf";
import type { CallOptions, ConnectError, Transport } from "@connectrpc/connect";
import type {
  UseMutationOptions as TSUseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import { useMutation as tsUseMutation } from "@tanstack/react-query";
import { useCallback } from "react";

import type { ConnectQueryKey } from "./connect-query-key";
import type { MethodUnaryDescriptor } from "./method-unary-descriptor";
import { useTransport } from "./use-transport";

/**
 * Options for useQuery
 */
export type UseMutationOptions<
  I extends Message<I>,
  O extends Message<O>,
> = Omit<
  TSUseMutationOptions<O, ConnectError, PartialMessage<I>, ConnectQueryKey<I>>,
  "mutationFn"
> & {
  transport?: Transport;
  callOptions?: Omit<CallOptions, "signal"> | undefined;
};

/**
 * Query the method provided. Maps to useMutation on tanstack/react-query
 *
 * @param methodSig
 * @returns
 */
export function useMutation<I extends Message<I>, O extends Message<O>>(
  methodSig: MethodUnaryDescriptor<I, O>,
  { transport, callOptions, ...queryOptions }: UseMutationOptions<I, O> = {}
): UseMutationResult<O, ConnectError, PartialMessage<I>> {
  const transportFromCtx = useTransport();
  const transportToUse = transport ?? transportFromCtx;
  const mutationFn = useCallback(
    async (input: PartialMessage<I>) => {
      const result = await transportToUse.unary(
        { typeName: methodSig.service.typeName, methods: {} },
        methodSig,
        undefined,
        callOptions?.timeoutMs,
        callOptions?.headers,
        input
      );
      return result.message;
    },
    [transportToUse, callOptions, methodSig]
  );
  return tsUseMutation({
    ...queryOptions,
    mutationFn,
  });
}
