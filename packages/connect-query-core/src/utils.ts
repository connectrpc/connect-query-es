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
import { create, isMessage } from "@bufbuild/protobuf";

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
  | undefined
  | ((prev?: MessageShape<O>) => MessageShape<O> | undefined);

/**
 * This helper makes sure that the type for the original response message is returned.
 */
export const createProtobufSafeUpdater =
  <O extends DescMessage>(
    schema: Pick<DescMethodUnary<never, O>, "output">,
    updater: ConnectUpdater<O>,
  ) =>
  (prev?: MessageShape<O>): MessageShape<O> | undefined => {
    if (typeof updater !== "function") {
      if (updater === undefined) {
        return undefined;
      }
      if (isMessage(updater, schema.output)) {
        return updater;
      }
      return create(schema.output, updater);
    }
    return updater(prev);
  };
