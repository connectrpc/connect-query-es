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
import type { CallOptions, Transport } from "@connectrpc/connect";

import type { MethodUnaryDescriptor } from "./method-unary-descriptor.js";

/**
 * Call a unary method given its signature and input.
 */
export async function callUnaryMethod<
  I extends Message<I>,
  O extends Message<O>,
>(
  methodType: MethodUnaryDescriptor<I, O>,
  input: PartialMessage<I> | undefined,
  {
    callOptions,
    transport,
  }: {
    transport: Transport;
    callOptions?: CallOptions | undefined;
  },
): Promise<O> {
  const result = await transport.unary(
    { typeName: methodType.service.typeName, methods: {} },
    methodType,
    callOptions?.signal,
    callOptions?.timeoutMs,
    callOptions?.headers,
    input ?? {},
    callOptions?.contextValues,
  );
  callOptions?.onHeader?.(result.header);
  callOptions?.onTrailer?.(result.trailer);
  return result.message;
}
