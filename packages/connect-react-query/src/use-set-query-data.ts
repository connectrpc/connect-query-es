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
  methodSig: MethodUnaryDescriptor<I, O>,
) {
  const queryClient = useQueryClient();
  return (
    updater: ConnectUpdater<O>,
    input?: DisableQuery | PartialMessage<I> | undefined,
    options?: SetDataOptions | undefined,
  ) => {
    return queryClient.setQueryData(
      createConnectQueryKey(methodSig, input),
      updater,
      options,
    );
  };
}
