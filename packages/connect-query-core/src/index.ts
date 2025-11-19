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

export type { ConnectQueryKey } from "./connect-query-key.js";
export { createConnectQueryKey } from "./connect-query-key.js";
export { createProtobufSafeUpdater } from "./utils.js";
export type { ConnectUpdater } from "./utils.js";
export { callUnaryMethod } from "./call-unary-method.js";
export { createInfiniteQueryOptions } from "./create-infinite-query-options.js";
export type {
  ConnectInfiniteQueryOptions,
  InfiniteQueryOptionsWithSkipToken,
  InfiniteQueryOptions,
} from "./create-infinite-query-options.js";
export { createQueryOptions } from "./create-query-options.js";
export type {
  QueryOptions,
  QueryOptionsWithSkipToken,
} from "./create-query-options.js";
export { addStaticKeyToTransport } from "./transport-key.js";
export type { SkipToken } from "@tanstack/query-core";
export { skipToken } from "@tanstack/query-core";
