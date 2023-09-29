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

import type { UnaryFunctions } from "./create-unary-functions.js";
import { useTransport } from "./use-transport.js";

/**
 * All the additional hooks that are unique to React.
 */
export interface UnaryHooks<
  I extends Message<I>,
  O extends Message<O>,
  M extends UnaryFunctions<I, O>,
> {
  /** The hook version, including transport, of createUseQueryOptions. */
  useQuery: M["createUseQueryOptions"];
  /** The hook version, including transport, of createUseMutationOptions. */
  useMutation: M["createUseMutationOptions"];
  /** The hook version, including transport, of createUseInfiniteQueryOptions. */
  useInfiniteQuery: M["createUseInfiniteQueryOptions"];
}

/**
 * Creates the hooks for a given set of unary methods.
 */
export function createUnaryHooks<I extends Message<I>, O extends Message<O>>(
  unaryMethods: UnaryFunctions<I, O>
): UnaryHooks<I, O, UnaryFunctions<I, O>> {
  return {
    useQuery: (input, options) => {
      const transport = useTransport();
      return unaryMethods.createUseQueryOptions(input, {
        transport,
        ...options,
      });
    },
    useInfiniteQuery: (input, options) => {
      const transport = useTransport();
      return unaryMethods.createUseInfiniteQueryOptions(input, {
        transport,
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
