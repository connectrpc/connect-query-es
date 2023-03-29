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

import type { CallOptions, MethodImpl, Transport} from '@bufbuild/connect';
import { createConnectRouter, createMethodImplSpec,createRouterHttpClient  } from '@bufbuild/connect';
import {
  createUniversalMethodHandler,
  validateReadWriteMaxBytes,
} from '@bufbuild/connect/protocol';
import {
  createHandlerFactory,
  createTransport,
} from '@bufbuild/connect/protocol-connect';
import { createConnectTransport } from '@bufbuild/connect-web';
import type { Message, PlainMessage, ServiceType } from '@bufbuild/protobuf';
import { jest } from '@jest/globals';
import type { QueryClientConfig } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BigIntService, ElizaService } from 'generated-react/dist/eliza_connectweb';
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
 *
 */
const makeMockTransport = <
  I extends Message<I>,
  O extends Message<O>,
  S extends ServiceType,
  M extends S['methods'][keyof S['methods']],
  // Spy extends (...args: any) => any
>({
  response,
  service,
  methodInfo,
}: // spy,
{
  /** */
  response: MethodImpl<M>;
  /** */
  methodInfo: M;
  /** */
  service: S;
  // spy?: (implementation?: Spy | undefined) => Spy;
}) => {
  const spec = createMethodImplSpec(service, methodInfo, response);
  const handler = createUniversalMethodHandler(spec, [
    createHandlerFactory({}),
  ]);

  const httpClient = createRouterHttpClient({
    ...createConnectRouter({}),
    handlers: [handler],
  });

  const transport = createTransport({
    httpClient,
    baseUrl: 'in-memory',
    useBinaryFormat: false,
    interceptors: [],
    acceptCompression: [],
    sendCompression: null,
    ...validateReadWriteMaxBytes(undefined, undefined, undefined),
  });

  const spy = ''.length === 0 ? jest.fn : null;
  if (spy) {
    return {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- TODO
      stream: spy(transport.stream),
      unary: spy(() => ({
        // @ts-expect-error(1234) TODO
        message: response(),
      })),
    } as unknown as Transport;
  }

  return transport;
};

/**
 * a mock Transport for Eliza
 */
export const mockElizaTransport = () => makeMockTransport({
  service: ElizaService,
  methodInfo: ElizaService.methods.say,
  response: () => new SayResponse(hardcodedResponse),
});

/**
 * a mock Transport for BigInt
 */
export const mockBigIntTransport = () => makeMockTransport({
  service: BigIntService,
  methodInfo: BigIntService.methods.count,
  response: () => new CountResponse({ count: 1n }),
});

/**
 * acts as an impromptu database
 */
export const mockStatefulBigIntTransport = () => {
  let count = 0n;

  return makeMockTransport({
    service: BigIntService,
    methodInfo: BigIntService.methods.count,
    response: () => {
      count += 1n;
      return new CountResponse({ count });
    },
  });
};

export const mockCallOptions = {
  signal: new AbortController().signal,
  timeoutMs: 9000,
  headers: new Headers({
    'Content-Type': 'application/x-shockwave-flash; version="1"',
  }),
} satisfies CallOptions;
