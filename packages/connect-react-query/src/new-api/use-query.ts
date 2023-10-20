import type {
  Message,
  MethodInfoUnary,
  PartialMessage,
} from "@bufbuild/protobuf";
import type { ConnectError } from "@connectrpc/connect";
import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery as tsUseQuery } from "@tanstack/react-query";

import { makeConnectQueryKeyGetter } from "../connect-query-key";
import { createUnaryQueryFn } from "../create-unary-query-fn";
import { useTransport } from "../use-transport";
import type { DisableQuery } from "../utils";
import { disableQuery } from "../utils";

/** Defines a standalone method and associated service  */
export type MethodUnaryType<
  I extends Message<I>,
  O extends Message<O>,
> = MethodInfoUnary<I, O> & {
  localName: string;
  service: {
    typeName: string;
  };
};

/**
 * Query the method provided. Maps to useQuery on tanstack/react-query
 *
 * @param methodSig
 * @returns
 */
export function useQuery<I extends Message<I>, O extends Message<O>>(
  methodSig: MethodUnaryType<I, O>,
  input: DisableQuery | PartialMessage<I> | undefined
): UseQueryResult<O, ConnectError> {
  const getQueryKey = makeConnectQueryKeyGetter(
    methodSig.service.typeName,
    methodSig.name
  );
  const transport = useTransport();
  return tsUseQuery({
    queryKey: getQueryKey(input),
    enabled: input === disableQuery,
    queryFn: createUnaryQueryFn(methodSig, input, { transport }),
  });
}
