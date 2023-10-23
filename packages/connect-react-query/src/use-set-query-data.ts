import type { Message, PartialMessage } from "@bufbuild/protobuf";
import type { SetDataOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

import { createConnectQueryKey } from "./connect-query-key";
import type { MethodUnaryDescriptor } from "./method-unary-descriptor";
import type { ConnectUpdater, DisableQuery } from "./utils";

/**
 * A typesafe version of `setQueryData` from TanStack Query. This returns a setter for a specific
 * RPC service method.
 */
export function useSetQueryData<I extends Message<I>, O extends Message<O>>(
  methodSig: MethodUnaryDescriptor<I, O>
) {
  const queryClient = useQueryClient();
  return (
    updater: ConnectUpdater<O>,
    input?: DisableQuery | PartialMessage<I> | undefined,
    options?: SetDataOptions | undefined
  ) => {
    return queryClient.setQueryData(
      createConnectQueryKey(methodSig, input),
      updater,
      options
    );
  };
}
