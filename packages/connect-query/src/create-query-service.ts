// Copyright 2021-2023 Buf Technologies, Inc.
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

import type { ServiceType } from "@bufbuild/protobuf";
import type { Transport } from "@connectrpc/connect";

import type { QueryFunctions } from "./create-query-functions";
import { createQueryFunctions } from "./create-query-functions";

const servicesToHooks = new Map<ServiceType, QueryFunctions<ServiceType>>();

/**
 * `createQueryService` is the main entrypoint for Connect-Query.
 *
 * Pass in a service and you will receive an object with properties for each of your services and values that provide hooks for those services that you can then give to Tanstack Query.  The `ServiceType` TypeScript interface is provided by Protobuf-ES (`@bufbuild/protobuf`) while generated service definitions are provided by Connect-Web (`@connectrpc/connect-web`).
 *
 * `Transport` refers to the mechanism by which your client will make the actual network calls.  If you want to use a custom transport, you can optionally provide one with a call to `useTransport`, which Connect-Query exports.  Otherwise, the default transport from React context will be used.  This default transport is placed on React context by the `TransportProvider`. Whether you pass a custom transport or you use `TransportProvider`, in both cases you'll need to use one of `@connectrpc/connect-web`'s exports `createConnectTransport` or `createGrpcWebTransport`.
 *
 * Note that the most memory performant approach is to use the transport on React Context by using the `TransportProvider` because that provider is memoized by React, but also that any calls to `createQueryService` with the same service is cached by this function.
 *
 * @example
 *
 * export const { say } = createQueryService({
 *   service: {
 *     methods: {
 *       say: {
 *         name: "Say",
 *         kind: MethodKind.Unary,
 *         I: SayRequest,
 *         O: SayResponse,
 *       },
 *     },
 *     typeName: "connectrpc.eliza.v1.ElizaService",
 *   },
 * });
 *
 * const { data, isLoading, ...etc } = useQuery(say.createUseQueryOptions());
 */
export const createQueryService = <Service extends ServiceType>({
  service,
  transport,
}: {
  service: Service;
  transport?: Transport;
}): QueryFunctions<Service> => {
  if (transport) {
    // custom transports are not cached
    return createQueryFunctions({
      service,
      transport,
    });
  }

  let hooks = servicesToHooks.get(service) as
    | QueryFunctions<Service>
    | undefined;
  if (!hooks) {
    hooks = createQueryFunctions({ service });
    servicesToHooks.set(service, hooks);
  }

  return hooks;
};
