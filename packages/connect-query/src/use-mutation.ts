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

import type { Message, PartialMessage } from "@bufbuild/protobuf";
import type { CallOptions, ConnectError, Transport } from "@connectrpc/connect";
import type {
  UseMutationOptions as TSUseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import { useMutation as tsUseMutation } from "@tanstack/react-query";
import { useCallback } from "react";

import type { MethodUnaryDescriptor } from "./method-unary-descriptor.js";
import { useTransport } from "./use-transport.js";

/**
 * Options for useQuery
 */
export type UseMutationOptions<
  I extends Message<I>,
  O extends Message<O>,
  Ctx = unknown,
> = Omit<
  TSUseMutationOptions<O, ConnectError, PartialMessage<I>, Ctx>,
  "mutationFn"
> & {
  transport?: Transport;
  callOptions?: CallOptions;
};

/**
 * Query the method provided. Maps to useMutation on tanstack/react-query
 *
 * @param methodSig
 * @returns
 */
export function useMutation<
  I extends Message<I>,
  O extends Message<O>,
  Ctx = unknown,
>(
  methodSig: MethodUnaryDescriptor<I, O>,
  // istanbul ignore next
  {
    transport,
    callOptions,
    ...queryOptions
  }: UseMutationOptions<I, O, Ctx> = {},
): UseMutationResult<O, ConnectError, PartialMessage<I>, Ctx> {
  const transportFromCtx = useTransport();
  const transportToUse = transport ?? transportFromCtx;
  const mutationFn = useCallback(
    async (input: PartialMessage<I>) => {
      const result = await transportToUse.unary(
        { typeName: methodSig.service.typeName, methods: {} },
        methodSig,
        callOptions?.signal,
        callOptions?.timeoutMs,
        callOptions?.headers,
        input,
      );
      return result.message;
    },
    [transportToUse, callOptions, methodSig],
  );
  return tsUseMutation({
    ...queryOptions,
    mutationFn,
  });
}
