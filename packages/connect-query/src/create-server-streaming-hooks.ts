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

import type { Message } from "@bufbuild/protobuf";
import { useQueryClient } from "@tanstack/react-query";

import type { ServerStreamingFunctions } from "./create-server-streaming-functions";
import { useTransport } from "./use-transport";

/**
 * All the additional hooks that are unique to React.
 */
export interface ServerStreamingHooks<
  I extends Message<I>,
  O extends Message<O>,
  M extends ServerStreamingFunctions<I, O>,
> {
  /** The hook version, including transport, of createUseQueryOptions. */
  useQuery: M["createUseQueryOptions"];
  /** The hook version, including transport, of createUseMutationOptions. */
  useMutation: M["createUseMutationOptions"];
}

/**
 * Creates the hooks for a given set of unary methods.
 */
export function createServerStreamingHooks<
  I extends Message<I>,
  O extends Message<O>,
>(
  unaryMethods: ServerStreamingFunctions<I, O>,
): ServerStreamingHooks<I, O, ServerStreamingFunctions<I, O>> {
  return {
    useQuery: (input, options) => {
      const transport = useTransport();
      const queryClient = useQueryClient();
      return unaryMethods.createUseQueryOptions(input, {
        transport,
        queryClient,
        ...options,
      });
    },
    useMutation: (options) => {
      const transport = useTransport();
      return unaryMethods.createUseMutationOptions({
        transport,
        ...options,
      });
    },
  };
}
