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
  DescMethodUnary,
  MessageInitShape,
  MessageShape,
} from "@bufbuild/protobuf";
import { create } from "@bufbuild/protobuf";
import type { Transport } from "@connectrpc/connect";

/**
 * Call a unary method given its signature and input.
 */
// eslint-disable-next-line @typescript-eslint/max-params -- 4th param is optional
export async function callUnaryMethod<
  I extends DescMessage,
  O extends DescMessage,
>(
  transport: Transport,
  schema: DescMethodUnary<I, O>,
  input: MessageInitShape<I> | undefined,
  options?: {
    signal?: AbortSignal;
    headers?: HeadersInit;
  },
): Promise<MessageShape<O>> {
  const result = await transport.unary(
    schema,
    options?.signal,
    undefined,
    options?.headers,
    input ?? create(schema.input),
    undefined,
  );
  return result.message;
}
