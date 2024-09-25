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
import { create } from "@bufbuild/protobuf";

import type { MethodUnaryDescriptor } from "./method-unary-descriptor.js";

/**
 * Pass this value as an input to signal that you want to disable the query.
 */
export const disableQuery = Symbol("disableQuery");

/**
 * Use this type in situations where you want to disable a query from use.
 */
export type DisableQuery = typeof disableQuery;

/**
 * Throws an error with the provided message when the condition is `false`
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Invalid assertion: ${message}`);
  }
}

/**
 * Verifies that the provided input is a valid AbortController
 */
export const isAbortController = (input: unknown): input is AbortController => {
  if (
    typeof input === "object" &&
    input !== null &&
    "signal" in input &&
    typeof input.signal === "object" &&
    input.signal !== null &&
    "aborted" in input.signal &&
    typeof input.signal.aborted === "boolean" &&
    "abort" in input &&
    typeof input.abort === "function"
    // note, there are more things in this interface, but I stop the check here at `context.signal.aborted` and `context.abort` because (as off November 2022) that's all that connect-web is using (in `callback-client.ts`).
  ) {
    return true;
  }
  return false;
};

/**
 * @see `Updater` from `@tanstack/react-query`
 */
export type ConnectUpdater<O extends DescMessage> =
  | MessageInitShape<O>
  | ((prev?: MessageShape<O>) => MessageInitShape<O> | undefined);

/**
 * This helper makes sure that the Class for the original data is returned, even if what's provided is a partial message or a plain JavaScript object representing the underlying values.
 */
export const createProtobufSafeUpdater =
  <I extends DescMessage, O extends DescMessage>(
    schema: Pick<MethodUnaryDescriptor<I, O>, "output">,
    updater: ConnectUpdater<O>,
  ) =>
  (prev?: MessageShape<O>): MessageShape<O> => {
    if (typeof updater === "function") {
      return create(
        schema.output,
        (
          updater as (prev?: MessageShape<O>) => MessageInitShape<O> | undefined
        )(prev),
      );
    }

    return create(schema.output, updater);
  };
