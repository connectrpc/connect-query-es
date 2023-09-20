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

import type { UnaryFunctions } from "./create-unary-functions";
import type { UnaryHooks } from "./create-unary-hooks";

export { createQueryService } from "./create-query-service";
export type {
  QueryFunctions,
  SupportedMethodInfo,
  IsSupportedMethod,
  SupportedMethodKinds,
} from "./create-query-functions";
export {
  createQueryFunctions,
  supportedMethodKinds,
  isSupportedMethod,
} from "./create-query-functions";
export type {
  ConnectQueryKey,
  ConnectPartialQueryKey,
} from "./connect-query-key";
export type { UnaryFunctions } from "./create-unary-functions";
export { createUnaryFunctions } from "./create-unary-functions";
export { disableQuery } from "./utils";
export { useTransport, TransportProvider } from "./use-transport";
export type { UnaryHooks } from "./create-unary-hooks";
export { createUnaryHooks } from "./create-unary-hooks";

/**
 * Combined type of all the functions generated for a service.
 */
export type UnaryFunctionsWithHooks<
  I extends Message<I>,
  O extends Message<O>,
> = UnaryFunctions<I, O> & UnaryHooks<I, O, UnaryFunctions<I, O>>;
