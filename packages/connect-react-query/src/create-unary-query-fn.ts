import type { Message, PartialMessage } from "@bufbuild/protobuf";
import type { CallOptions, Transport } from "@connectrpc/connect";
import type { QueryFunction } from "@tanstack/react-query";

import type { ConnectQueryKey } from "./connect-query-key";
import type { MethodUnaryDescriptor } from "./method-unary-descriptor";
import { assert, type DisableQuery, disableQuery } from "./utils";

/**
 * Creates a base unary query function that runs in react-query.
 */
export function createUnaryQueryFn<I extends Message<I>, O extends Message<O>>(
  methodType: MethodUnaryDescriptor<I, O>,
  input: DisableQuery | PartialMessage<I> | undefined,
  {
    callOptions,
    transport,
  }: {
    transport: Transport;
    callOptions?: CallOptions | undefined;
  }
): QueryFunction<O, ConnectQueryKey<I>> {
  return async (context) => {
    assert(input !== disableQuery, "Disabled query cannot be fetched");
    const result = await transport.unary(
      { typeName: methodType.service.typeName, methods: {} },
      methodType,
      (callOptions ?? context).signal,
      callOptions?.timeoutMs,
      callOptions?.headers,
      input ?? {}
    );
    return result.message;
  };
}
