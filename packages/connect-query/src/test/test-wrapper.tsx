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

import type { Transport } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import type { QueryClientConfig } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { JSXElementConstructor, PropsWithChildren } from "react";

import { TransportProvider } from "../use-transport.js";

/**
 * A utils wrapper that supplies Tanstack Query's `QueryClientProvider` as well as Connect-Query's `TransportProvider`.
 */
export const wrapper = (
  config?: QueryClientConfig,
  transport = createConnectTransport({
    baseUrl: "https://demo.connectrpc.com",
  }),
): {
  wrapper: JSXElementConstructor<PropsWithChildren>;
  queryClient: QueryClient;
  transport: Transport;
  queryClientWrapper: JSXElementConstructor<PropsWithChildren>;
} => {
  const queryClient = new QueryClient(config);
  return {
    wrapper: ({ children }) => (
      <TransportProvider transport={transport}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </TransportProvider>
    ),
    queryClient,
    transport,
    queryClientWrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
};
