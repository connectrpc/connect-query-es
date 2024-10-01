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

import type { PartialMessage } from "@bufbuild/protobuf";
import type { CallOptions, Transport } from "@connectrpc/connect";
import { createRouterTransport } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import type { QueryClientConfig } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { JSXElementConstructor, PropsWithChildren } from "react";

import { defaultOptions } from "../default-options.js";
import {
  BigIntService,
  ElizaService,
  PaginatedService,
} from "../gen/eliza_connect.js";
import type {
  CountRequest,
  ListResponse,
  SayRequest,
} from "../gen/eliza_pb.js";
import { CountResponse, SayResponse } from "../gen/eliza_pb.js";
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
  const queryClient = new QueryClient({
    defaultOptions,
    ...config,
  });
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

/**
 * A test-only helper to increase time (necessary for testing react-query)
 */
export const sleep = async (timeout: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });

/**
 * a stateless mock for ElizaService
 */
export const mockEliza = (
  override?: PartialMessage<SayRequest>,
  addDelay = false,
) =>
  createRouterTransport((router) => {
    router.service(ElizaService, {
      say: async (input: SayRequest) => {
        if (addDelay) {
          await sleep(1000);
        }
        return new SayResponse(
          override ?? { sentence: `Hello ${input.sentence}` },
        );
      },
    });
  });

/**
 * a stateless mock for BigIntService
 */
export const mockBigInt = () =>
  createRouterTransport((router) => {
    router.service(BigIntService, {
      count: () => new CountResponse({ count: 1n }),
    });
  });

/**
 * a mock for BigIntService that acts as an impromptu database
 */
export const mockStatefulBigIntTransport = (addDelay = false) =>
  createRouterTransport((router) => {
    let count = 0n;
    router.service(BigIntService, {
      count: async (request?: CountRequest) => {
        if (addDelay) {
          await sleep(1000);
        }
        if (request) {
          count += request.add;
        }
        return new CountResponse({ count });
      },
      getCount: () => new CountResponse({ count }),
    });
  });

/**
 * a mock for PaginatedService that acts as an impromptu database
 */
export const mockPaginatedTransport = (
  override?: PartialMessage<ListResponse>,
  addDelay = false,
) =>
  createRouterTransport((router) => {
    router.service(PaginatedService, {
      list: async (request) => {
        if (addDelay) {
          await sleep(1000);
        }
        if (override !== undefined) {
          return override;
        }
        const base = (request.page - 1n) * 3n;
        const result = {
          page: request.page,
          items: [
            `${base + 1n} Item`,
            `${base + 2n} Item`,
            `${base + 3n} Item`,
          ],
        };
        return result;
      },
    });
  });

export const mockCallOptions = {
  signal: new AbortController().signal,
  timeoutMs: 9000,
  headers: new Headers({
    "Content-Type": 'application/x-shockwave-flash; version="1"',
  }),
} satisfies CallOptions;
