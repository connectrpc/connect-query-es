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

import type { DefaultOptions } from "@tanstack/react-query";

/**
 * These default options are required for proper query key hashing.
 *
 * For example, if you are using BigInt values, you will need this in order to avoid getting this expected JavaScript error:
 *
 * `Error: Uncaught [TypeError: Do not know how to serialize a BigInt]`
 *
 * when TanStack Query tries to serialize the value.
 */
export const defaultOptions = {
  queries: {},
} satisfies DefaultOptions;
