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
  DescMessage,
  MessageInitShape,
  MessageShape,
} from "@bufbuild/protobuf";
import type { ConnectError, Transport } from "@connectrpc/connect";
import type {
  UseMutationOptions as TSUseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import { useMutation as tsUseMutation } from "@tanstack/react-query";
import { useCallback } from "react";

import { callUnaryMethod } from "./call-unary-method.js";
import type { MethodUnaryDescriptor } from "./method-unary-descriptor.js";
import { useTransport } from "./use-transport.js";

/**
 * Options for useMutation
 */
export type UseMutationOptions<
  I extends DescMessage,
  O extends DescMessage,
  Ctx = unknown,
> = TSUseMutationOptions<
  MessageShape<O>,
  ConnectError,
  MessageInitShape<I>,
  Ctx
> & {
  /** The transport to be used for the fetching. */
  transport?: Transport;
};

/**
 * Query the method provided. Maps to useMutation on tanstack/react-query
 */
export function useMutation<
  I extends DescMessage,
  O extends DescMessage,
  Ctx = unknown,
>(
  schema: MethodUnaryDescriptor<I, O>,
  { transport, ...queryOptions }: UseMutationOptions<I, O, Ctx> = {},
): UseMutationResult<MessageShape<O>, ConnectError, MessageInitShape<I>, Ctx> {
  const transportFromCtx = useTransport();
  const transportToUse = transport ?? transportFromCtx;
  const mutationFn = useCallback(
    async (input: MessageInitShape<I>) =>
      callUnaryMethod(transportToUse, schema, input),
    [transportToUse, schema],
  );
  return tsUseMutation({
    ...queryOptions,
    mutationFn,
  });
}
