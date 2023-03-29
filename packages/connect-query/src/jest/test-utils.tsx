// Copyright 2021-2022 Buf Technologies, Inc.
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

import type { CallOptions, ConnectRouter } from '@bufbuild/connect';
import { createConnectRouter, createRouterHttpClient } from '@bufbuild/connect';
import { validateReadWriteMaxBytes } from '@bufbuild/connect/protocol';
import { createTransport } from '@bufbuild/connect/protocol-connect';
import { createConnectTransport } from '@bufbuild/connect-web';
import type { PlainMessage } from '@bufbuild/protobuf';
import { jest } from '@jest/globals';
import type { QueryClientConfig } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BigIntService,
  ElizaService,
} from 'generated-react/dist/eliza_connectweb';
import { CountResponse, SayResponse } from 'generated-react/dist/eliza_pb';
import type { JSXElementConstructor, PropsWithChildren } from 'react';

import { TransportProvider } from '../use-transport';

/**
 * a shared response to always respond with in tests
 */
export const hardcodedResponse: PlainMessage<SayResponse> = {
  sentence: 'success',
};

/**
 * A utils wrapper that supplies Tanstack Query's `QueryClientProvider` as well as Connect-Query's `TransportProvider`.
 */
export const wrapper = (
  config?: QueryClientConfig,
  transport = createConnectTransport({
    baseUrl: 'https://demo.connect.build',
  }),
): {
  wrapper: JSXElementConstructor<PropsWithChildren>;
  queryClient: QueryClient;
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
  };
};

/**
 * Asserts X and Y are equal
 */
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T,
>() => T extends Y ? 1 : 2
  ? true
  : false;

/**
 * Asserts X and Y are not equal
 */
export type NotEqual<X, Y> = true extends Equal<X, Y> ? false : true;

/**
 * Helper for `Alike`
 */
type MergeInsertions<T> = T extends object
  ? { [K in keyof T]: MergeInsertions<T[K]> }
  : T;

/**
 * Similar to `Equal`, but will contend with unions
 */
export type Alike<X, Y> = Equal<MergeInsertions<X>, MergeInsertions<Y>>;

/**
 * Will error if the condition is false
 */
export type Expect<T extends true> = T;

/**
 * Will error if the condition is true
 */
export type ExpectFalse<T extends false> = T;

/**
 * Asserts that a given type is any
 *
 * see https://stackoverflow.com/questions/49927523/disallow-call-with-any/49928360#49928360
 */
export type IsAny<T> = 0 extends T & 1 ? true : false;

/**
 * A test-only helper to increase time (necessary for testing react-query)
 */
export const sleep = async (timeout: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });

/**
 * TODO: this will (ideally) be provided by connect itself and not live in this codebase
 */
const makeMockTransport = (routes: (router: ConnectRouter) => void) => {
  const router = createConnectRouter();
  routes(router);
  const httpClient = createRouterHttpClient(router);

  return createTransport({
    httpClient,
    baseUrl: 'http://in.memory.com',
    useBinaryFormat: false,
    interceptors: [],
    acceptCompression: [],
    sendCompression: null,
    ...validateReadWriteMaxBytes(undefined, undefined, undefined),
  });
};

/**
 * a stateless mock for ElizaService
 */
export const mockEliza = () => {
  const say = jest.fn(() => new SayResponse(hardcodedResponse));
  return {
    transport: makeMockTransport(({ service }) => {
      service(ElizaService, { say });
    }),
    say,
  };
};

/**
 * a stateless mock for BigIntService
 */
export const mockBigInt = () => {
  const count = jest.fn(() => new CountResponse({ count: 1n }));
  return {
    transport: makeMockTransport(({ service }) => {
      service(BigIntService, { count });
    }),
    count,
  };
};

/**
 * a mock for BigIntService that acts as an impromptu database
 */
export const mockStatefulBigIntTransport = () => {
  let count = 0n;
  const spy = jest.fn(() => {
    count += 1n;
    return new CountResponse({ count });
  });
  return {
    transport: makeMockTransport(({ service }) => {
      service(BigIntService, {
        count: spy,
      });
    }),
    count: spy,
  };
};

export const mockCallOptions = {
  signal: new AbortController().signal,
  timeoutMs: 9000,
  headers: new Headers({
    'Content-Type': 'application/x-shockwave-flash; version="1"',
  }),
} satisfies CallOptions;
