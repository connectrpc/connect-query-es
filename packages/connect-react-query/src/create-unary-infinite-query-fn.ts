import type { Message, PartialMessage } from "@bufbuild/protobuf";
import type { Transport } from "@connectrpc/connect";
import type { QueryFunction } from "@tanstack/react-query";

import type { ConnectQueryKey } from "./connect-query-key";
import type { MethodUnaryDescriptor } from "./method-unary-descriptor";
import type { UseInfiniteQueryConnectOptions } from "./use-infinite-query";
import { assert, type DisableQuery, disableQuery } from "./utils";

/**
 * Creates a base unary query function that runs in react-query.
 */
export function createUnaryInfiniteQueryFn<
  I extends Message<I>,
  O extends Message<O>,
  ParamKey extends keyof PartialMessage<I>,
>(
  methodType: MethodUnaryDescriptor<I, O>,
  input: DisableQuery | PartialMessage<I>,
  {
    callOptions,
    transport,
    pageParamKey,
  }: Omit<
    UseInfiniteQueryConnectOptions<I, O, ParamKey>,
    "getNextPageParam" | "sanitizeInputKey" | "transport"
  > & {
    transport: Transport;
  }
): QueryFunction<O, ConnectQueryKey<I>, PartialMessage<I>[ParamKey]> {
  return async (context) => {
    assert(input !== disableQuery, "Disabled query cannot be fetched");
    assert("pageParam" in context, "pageParam must be part of context");

    const inputCombinedWithPageParam = {
      ...input,
      [pageParamKey]: context.pageParam,
    };
    const result = await transport.unary(
      { typeName: methodType.service.typeName, methods: {} },
      methodType,
      context.signal,
      callOptions?.timeoutMs,
      callOptions?.headers,
      inputCombinedWithPageParam
    );
    return result.message;
  };
}
