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

import type { CallOptions, ConnectError, Transport } from '@bufbuild/connect';
import type {
  Message,
  MethodInfoUnary,
  PartialMessage,
} from '@bufbuild/protobuf';
import { MethodKind } from '@bufbuild/protobuf';
import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type {
  GetNextPageParamFunction,
  QueryFunctionContext,
  UseMutationResult,
} from '@tanstack/react-query';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import {
  BigIntService,
  ElizaService,
  PaginatedService,
} from 'generated-react/dist/eliza_connect';
import type {
  CountRequest,
  CountResponse,
  SayRequest,
} from 'generated-react/dist/eliza_pb';
import { SayResponse } from 'generated-react/dist/eliza_pb';
import { spyOn } from 'jest-mock';

import type {
  ConnectPartialQueryKey,
  ConnectQueryKey,
} from './connect-query-key';
import { defaultOptions } from './default-options';
import type { Equal, Expect } from './jest/test-utils';
import {
  mockBigInt,
  mockCallOptions,
  mockEliza,
  mockPaginatedTransport,
  mockStatefulBigIntTransport,
  sleep,
  wrapper,
} from './jest/test-utils';
import { unaryHooks } from './unary-hooks';
import type { DisableQuery } from './utils';
import { disableQuery } from './utils';

const consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});

const genCount = unaryHooks({
  methodInfo: BigIntService.methods.count,
  typeName: BigIntService.typeName,
});

const genSay = unaryHooks({
  methodInfo: ElizaService.methods.say,
  typeName: ElizaService.typeName,
});

const genPaginated = unaryHooks({
  methodInfo: PaginatedService.methods.list,
  typeName: PaginatedService.typeName,
});

describe('unaryHooks', () => {
  it('produces the intended API surface', () => {
    type ExpectType_sayKeys = Expect<
      Equal<
        keyof typeof genSay,
        | 'createData'
        | 'createUseQueryOptions'
        | 'getPartialQueryKey'
        | 'getQueryKey'
        | 'methodInfo'
        | 'setQueriesData'
        | 'setQueryData'
        | 'useInfiniteQuery'
        | 'useMutation'
        | 'useQuery'
      >
    >;

    const matchers: Record<keyof typeof genSay, unknown> = {
      createData: expect.any(Function),
      createUseQueryOptions: expect.any(Function),
      getPartialQueryKey: expect.any(Function),
      getQueryKey: expect.any(Function),
      methodInfo: expect.objectContaining(ElizaService.methods.say),
      setQueriesData: expect.any(Function),
      setQueryData: expect.any(Function),
      useInfiniteQuery: expect.any(Function),
      useQuery: expect.any(Function),
      useMutation: expect.any(Function),
    };

    const sorter = (a: string, b: string) => a.localeCompare(b);
    expect(Object.keys(genSay).sort(sorter)).toStrictEqual(
      Object.keys(matchers).sort(sorter),
    );

    expect(genSay).toMatchObject(matchers);
  });

  it('throws when provided non unary services', () => {
    expect(() => {
      unaryHooks({
        methodInfo: {
          ...ElizaService.methods.say,
          // @ts-expect-error(2322) intentionally incorrect
          kind: MethodKind.BiDiStreaming,
        },
        service: ElizaService,
      });
    }).toThrow('unaryHooks was passed a non unary method, Say');
  });

  it('uses a custom transport', async () => {
    const input = { sentence: 'ziltoid' } satisfies PartialMessage<SayRequest>;
    const transport = mockEliza();

    const { result } = renderHook(async () => {
      const { queryFn } = genSay.useQuery(input);

      return queryFn();
    }, wrapper({}, transport));

    const response = await result.current;

    expect(response.sentence).toEqual(`Hello ${input.sentence}`);
  });

  describe('createData', () => {
    it('creates data as expected', () => {
      const partial: PartialMessage<CountResponse> = {
        count: 1n,
      };
      const expected = new BigIntService.methods.count.O(partial);

      expect(genCount.createData(partial)).toStrictEqual(expected);
    });
  });

  // note: the bulk of this helper is tested via the API's main entry point: `useQuery`, which simply calls this function with automatic inference of transport.
  describe('createUseQueryOptions', () => {
    it('has the intended API surface', () => {
      type ExpectType_CreateUserQueryOptionsParams = Expect<
        Equal<Parameters<typeof genCount.createUseQueryOptions>['length'], 2>
      >;
      
      type ExpectType_CreateUserQueryOptionsParams1 = Expect<
        Equal<
          Parameters<typeof genCount.createUseQueryOptions>[1],
          {
            getPlaceholderData?: (
              enabled: boolean,
            ) => PartialMessage<CountResponse> | undefined;
            onError?: (error: ConnectError) => void;
            transport: Transport;
            callOptions?: CallOptions | undefined;
          }
        >
      >;
      type ExpectType_CreateUserQueryOptionsReturn = Expect<
        Equal<
          ReturnType<typeof genCount.createUseQueryOptions>,
          {
            enabled: boolean;
            queryKey: ConnectQueryKey<CountRequest>;
            queryFn: (
              context?:
                | QueryFunctionContext<ConnectQueryKey<CountRequest>>
                | undefined,
            ) => Promise<CountResponse>;
            placeholderData?: () => CountResponse | undefined;
            onError?: (error: ConnectError) => void;
          }
        >
      >;

      expect.assertions(0);
    });

    it('requires transport', () => {
      const message =
        'createUseQueryOptions requires you to provide a Transport.  If you want automatic inference of Transport, try using the useQuery helper.';
      expect(() =>
        genCount.createUseQueryOptions(
          {},
          {
            // @ts-expect-error(2322) intentionally incorrect
            transport: undefined,
          },
        ),
      ).toThrow(`Invalid assertion: ${message}`);
      expect(() =>
        genCount.createUseQueryOptions(
          {},
          // @ts-expect-error(2322) intentionally incorrect
          {},
        ),
      ).toThrow(`Invalid assertion: ${message}`);
    });
  });

  describe('getPartialQueryKey', () => {
    type ExpectType_GetQuery = Expect<
      Equal<typeof genSay.getPartialQueryKey, () => ConnectPartialQueryKey>
    >;

    it('returns a partial query key', () => {
      expect(genSay.getPartialQueryKey()).toStrictEqual([
        'buf.connect.demo.eliza.v1.ElizaService',
        'Say',
      ]);
    });
  });

  describe('getQueryKey', () => {
    type ExpectType_GetQuery = Expect<
      Equal<
        typeof genSay.getQueryKey,
        (
          input?: DisableQuery | PartialMessage<SayRequest>,
        ) => ConnectQueryKey<SayRequest>
      >
    >;

    it('returns a simple query key with an input', () => {
      const sentence = { sentence: 'ziltoid' };
      expect(genSay.getQueryKey(sentence)).toStrictEqual([
        'buf.connect.demo.eliza.v1.ElizaService',
        'Say',
        sentence,
      ]);
    });

    it('returns handles disableQuery', () => {
      expect(genSay.getQueryKey(disableQuery)).toStrictEqual([
        'buf.connect.demo.eliza.v1.ElizaService',
        'Say',
        {},
      ]);
    });

    it('returns handles no input', () => {
      expect(genSay.getQueryKey()).toStrictEqual([
        'buf.connect.demo.eliza.v1.ElizaService',
        'Say',
        {},
      ]);
      expect(genSay.getQueryKey(undefined)).toStrictEqual([
        'buf.connect.demo.eliza.v1.ElizaService',
        'Say',
        {},
      ]);
      // @ts-expect-error(2345) intentionally incorrect
      expect(genSay.getQueryKey(null)).toStrictEqual([
        'buf.connect.demo.eliza.v1.ElizaService',
        'Say',
        {},
      ]);
    });
  });

  describe('methodInfo', () => {
    it('attaches the methodInfo for convenience', () => {
      type ExpectType_sayMethodInfo = Expect<
        Equal<
          typeof genSay.methodInfo,
          MethodInfoUnary<SayRequest, SayResponse>
        >
      >;
      expect(genSay.methodInfo).toStrictEqual(ElizaService.methods.say);
    });
  });

  describe('setQueriesData & setQueryData', () => {
    /** @returns 2n */
    const partialUpdater = new BigIntService.methods.count.O({ count: 2n });

    const request = { add: 2n };

    describe('setQueriesData', () => {
      it('returns the correct queryKey', () => {
        const [queryKey] = genCount.setQueriesData(partialUpdater);
        type ExpectType_QueryKey = Expect<
          Equal<typeof queryKey, ConnectPartialQueryKey>
        >;
        expect(queryKey).toStrictEqual([
          'buf.connect.demo.eliza.v1.BigIntService',
          'Count',
        ]);
      });

      it('allows a partial message updater', async () => {
        const transport = mockBigInt();
        const { queryClient, ...rest } = wrapper({ defaultOptions });

        const { result, rerender } = renderHook(
          () => useQuery(genCount.useQuery(request, { transport })),
          rest,
        );
        type ExpectType_Data = Expect<
          Equal<typeof result.current.data, CountResponse | undefined>
        >;

        await waitFor(() => {
          expect(result.current.isSuccess).toBeTruthy();
        });

        expect(result.current.data?.count).toStrictEqual(1n);

        queryClient.setQueriesData(...genCount.setQueriesData(partialUpdater));
        rerender();

        // this value comes from the partial updater
        expect(result.current.data?.count).toStrictEqual(2n);
      });
    });

    describe('setQueryData', () => {
      it('returns the correct queryKey', () => {
        const [queryKey] = genCount.setQueryData(partialUpdater, request);
        type ExpectType_QueryKey = Expect<
          Equal<typeof queryKey, ConnectQueryKey<CountRequest>>
        >;
        expect(queryKey).toStrictEqual([
          'buf.connect.demo.eliza.v1.BigIntService',
          'Count',
          request,
        ]);
      });

      it('allows a partial message updater', async () => {
        const { queryClient, ...rest } = wrapper(
          { defaultOptions },
          mockBigInt(),
        );

        const { result, rerender } = renderHook(
          () => useQuery(genCount.useQuery(request)),
          rest,
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBeTruthy();
        });

        expect(result.current.data?.count).toStrictEqual(1n);

        queryClient.setQueryData(
          ...genCount.setQueryData(partialUpdater, request),
        );
        rerender();

        // this value comes from the partial updater
        expect(result.current.data?.count).toStrictEqual(2n);
      });

      it('allows a function updater', async () => {
        /** @returns input + 1n */
        const functionUpdater = (
          { count }: { count: bigint } = { count: 1n },
        ) =>
          new BigIntService.methods.count.O({
            count: count + 1n,
          });

        const { queryClient, ...rest } = wrapper(
          { defaultOptions },
          mockBigInt(),
        );
        const { result, rerender } = renderHook(
          () => useQuery(genCount.useQuery(request)),
          rest,
        );

        type ExpectType_Data = Expect<
          Equal<typeof result.current.data, CountResponse | undefined>
        >;

        await waitFor(() => {
          expect(result.current.isSuccess).toBeTruthy();
        });

        expect(result.current.data?.count).toStrictEqual(1n);

        queryClient.setQueryData(
          ...genCount.setQueryData(functionUpdater, request),
        );
        rerender();

        // this value comes from the partial updater
        expect(result.current.data?.count).toStrictEqual(2n);
      });
    });
  });

  describe('useInfiniteQuery', () => {
    it('has the intended API surface', () => {
      type params = Parameters<typeof genCount.useInfiniteQuery>;
      type ExpectType_UseInfiniteQueryParamsLength = Expect<
        Equal<params['length'], 2>
      >;

      type ExpectType_UseInfiniteQueryParams0 = Expect<
        Equal<params[0], DisableQuery | PartialMessage<CountRequest>>
      >;

      type returnType = ReturnType<typeof genCount.useInfiniteQuery>;

      type ExpectType_UseInfiniteQueryReturnKeys = Expect<
        Equal<
          keyof returnType,
          'enabled' | 'getNextPageParam' | 'onError' | 'queryFn' | 'queryKey'
        >
      >;

      type ExpectType_UseInfiniteQueryReturn = Expect<
        Equal<
          returnType,
          {
            enabled: boolean;
            queryKey: ConnectQueryKey<CountRequest>;
            queryFn: (
              context: QueryFunctionContext<
                ConnectQueryKey<CountRequest>,
                bigint | undefined
              >,
            ) => Promise<CountResponse>;
            getNextPageParam: GetNextPageParamFunction<CountResponse>;
            onError?: (error: ConnectError) => void;
          }
        >
      >;

      expect(1).toEqual(1);
    });

    describe('transport', () => {
      it('prioritizes option transport', async () => {
        const mockTransportContext = mockEliza();
        const mockTransportTopLevel = mockEliza();
        const mockTransportOption = mockEliza({
          sentence: 'override',
        });
        const customSay = unaryHooks({
          methodInfo: ElizaService.methods.say,
          typeName: ElizaService.typeName,
          transport: mockTransportTopLevel,
        });

        const { result } = renderHook(
          () =>
            useInfiniteQuery(
              customSay.useInfiniteQuery(
                { sentence: 'Infinity' },
                {
                  pageParamKey: 'sentence',
                  getNextPageParam: () => '0',
                  transport: mockTransportOption,
                },
              ),
            ),
          wrapper({}, mockTransportContext),
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBeTruthy();
        });

        expect(result.current.data?.pages[0].sentence).toStrictEqual(
          'override',
        );
      });
    });

    it('integrates with `useInfiniteQuery`', async () => {
      const input = { page: 1n };

      const { result, rerender } = renderHook(
        () =>
          useInfiniteQuery(
            genPaginated.useInfiniteQuery(input, {
              pageParamKey: 'page',
              getNextPageParam: (lastPage) => lastPage.page + 1n,
            }),
          ),
        wrapper({ defaultOptions }, mockPaginatedTransport()),
      );

      expect(result.current.data).toStrictEqual(undefined);

      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(result.current.data?.pageParams).toStrictEqual([undefined]);

      expect(result.current.data?.pages).toHaveLength(1);
      expect(result.current.data?.pages[0].page).toStrictEqual(1n);
      expect(result.current.data?.pages[0].items).toStrictEqual([
        `1 Item`,
        `2 Item`,
        `3 Item`,
      ]);

      // execute a single increment
      await result.current.fetchNextPage();
      rerender();

      expect(result.current.data?.pageParams).toStrictEqual([undefined, 2n]);

      expect(result.current.data?.pages).toHaveLength(2);
      expect(result.current.data?.pages[1].page).toStrictEqual(2n);
      expect(result.current.data?.pages[1].items).toStrictEqual([
        `4 Item`,
        `5 Item`,
        `6 Item`,
      ]);

      // execute two increments at once
      await result.current.fetchNextPage();
      await result.current.fetchNextPage();
      rerender();

      expect(result.current.data?.pages).toHaveLength(4);
      expect(result.current.data?.pages[2].items).toStrictEqual([
        `7 Item`,
        `8 Item`,
        `9 Item`,
      ]);
      expect(result.current.data?.pages[3].items).toStrictEqual([
        `10 Item`,
        `11 Item`,
        `12 Item`,
      ]);
    });

    it('is disabled when input matches the `disableQuery` symbol', async () => {
      const { result } = renderHook(
        () =>
          genCount.useInfiniteQuery(disableQuery, {
            pageParamKey: 'add',
            getNextPageParam: (lastPage) => lastPage.count,
          }),
        wrapper(),
      );

      expect(result.current).toHaveProperty('enabled', false);

      await expect(result.current.queryFn).rejects.toThrow(
        'Invalid assertion: queryFn does not accept a disabled query',
      );
    });

    it('allows a pageParam for the queryFn', async () => {
      const input = { add: 1n };
      const getNextPageParam = (lastPage: CountResponse) => lastPage.count;
      const { result } = renderHook(
        () =>
          genCount.useInfiniteQuery(input, {
            pageParamKey: 'add',
            getNextPageParam,
            transport: mockBigInt(),
          }),
        wrapper(),
      );

      expect(result.current.getNextPageParam).toStrictEqual(getNextPageParam);

      const { count } = await result.current.queryFn({
        pageParam: 1n,
        queryKey: genCount.getQueryKey(input),
        meta: {},
      });

      expect(count).toStrictEqual(1n);
    });

    describe('onError', () => {
      beforeEach(() => {
        consoleErrorSpy.mockReset();
      });

      it("doesn't use onError if it isn't passed", () => {
        const { result } = renderHook(
          () =>
            genCount.useInfiniteQuery(
              {},
              {
                pageParamKey: 'add',
                getNextPageParam: (lastPage) => lastPage.count,
              },
            ),
          wrapper(),
        );
        expect(result.current.onError).toBeUndefined();
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });

      it('allows for a passthrough onError', async () => {
        const onError = jest.fn();
        const { result, rerender } = renderHook(
          () =>
            useQuery({
              ...genCount.useInfiniteQuery(
                // @ts-expect-error(2345) intentionally invalid input
                { nope: 'nope nope' },
                { onError, pageParamKey: 'add' },
              ),
              queryFn: async () => Promise.reject('error'),
              retry: false,
            }),
          wrapper(),
        );
        rerender();

        expect(result.current.error).toStrictEqual(null);
        expect(result.current.isError).toStrictEqual(false);
        expect(onError).toHaveBeenCalledTimes(0);
        expect(consoleErrorSpy).not.toHaveBeenCalled();

        await sleep(10);

        expect(result.current.error).toStrictEqual('error');
        expect(result.current.isError).toStrictEqual(true);
        expect(onError).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('error');
      });
    });

    it('passes through callOptions', () => {
      const transport = mockBigInt();
      const transportSpy = jest.spyOn(transport, 'unary');
      renderHook(
        () =>
          useInfiniteQuery(
            genCount.useInfiniteQuery(
              { add: 1n },
              {
                pageParamKey: 'add',
                getNextPageParam: (lastPage) => lastPage.count,
                transport,
                callOptions: mockCallOptions,
              },
            ),
          ),
        wrapper({ defaultOptions }),
      );

      expect(transportSpy).toHaveBeenCalledWith(
        expect.anything(), // service
        expect.anything(), // method
        mockCallOptions.signal, // signal
        mockCallOptions.timeoutMs, // timeoutMs
        mockCallOptions.headers, // headers
        expect.anything(), // input
      );
    });

    it('passes through the current pageParam on initial fetch', () => {
      const transport = mockPaginatedTransport();
      const transportSpy = jest.spyOn(transport, 'unary');
      renderHook(
        () =>
          useInfiniteQuery(
            genPaginated.useInfiniteQuery(
              { page: 1n },
              {
                pageParamKey: 'page',
                getNextPageParam: (lastPage) => lastPage.page + 1n,
                transport,
                callOptions: mockCallOptions,
              },
            ),
          ),
        wrapper({ defaultOptions }),
      );

      expect(transportSpy).toHaveBeenCalledWith(
        expect.anything(), // service
        expect.anything(), // method
        mockCallOptions.signal, // signal
        mockCallOptions.timeoutMs, // timeoutMs
        mockCallOptions.headers, // headers
        expect.objectContaining({
          page: 1n,
        }), // input
      );
    });

    // eslint-disable-next-line jest/expect-expect -- this test is just for a TS error
    it('provides typescript errors if both pageParamKey and applyPageParam are provided', () => {
      const transport = mockPaginatedTransport();
      renderHook(
        () =>
          useInfiniteQuery(
            genPaginated.useInfiniteQuery(
              { page: 1n },
              // @ts-expect-error(2345) intentionally invalid applyPageParam + pageParamKey
              {
                pageParamKey: 'page',
                getNextPageParam: (lastPage) => lastPage.page + 1n,
                transport,
                callOptions: mockCallOptions,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- test ignore
                applyPageParam: (input: unknown) => ({
                  // @ts-expect-error(2345) ignore these errors for testing
                  ...input,
                }),
              },
            ),
          ),
        wrapper({ defaultOptions }),
      );
    });

    it('removes the specified pageParamKey by default', () => {
      const transport = mockPaginatedTransport();
      const { result } = renderHook(
        () =>
          genPaginated.useInfiniteQuery(
            { page: 1n },
            {
              pageParamKey: 'page',
              getNextPageParam: (lastPage) => lastPage.page + 1n,
              transport,
              callOptions: mockCallOptions,
            },
          ),
        wrapper({ defaultOptions }),
      );

      expect(result.current.queryKey).toStrictEqual([
        'buf.connect.demo.eliza.v1.PaginatedService',
        'List',
        {
          page: undefined,
        },
      ]);
    });

    it('allows cleaning the queryKey', () => {
      const transport = mockPaginatedTransport();
      const { result } = renderHook(
        () =>
          genPaginated.useInfiniteQuery(
            { page: 1n },
            {
              applyPageParam: ({ pageParam, input }) => {
                if (pageParam === undefined) {
                  return input;
                }
                return {
                  ...input,
                  page: pageParam,
                };
              },
              sanitizeInputKey: (input) => ({
                ...input,
                page: undefined,
              }),
              getNextPageParam: (lastPage) => lastPage.page + 1n,
              transport,
              callOptions: mockCallOptions,
            },
          ),
        wrapper({ defaultOptions }),
      );

      expect(result.current.queryKey).toStrictEqual([
        'buf.connect.demo.eliza.v1.PaginatedService',
        'List',
        {
          page: undefined,
        },
      ]);
    });

    it('allows applying a page param dynamically', () => {
      const transport = mockPaginatedTransport();
      const transportSpy = jest.spyOn(transport, 'unary');
      renderHook(
        () =>
          useInfiniteQuery(
            genPaginated.useInfiniteQuery(
              { page: 1n },
              {
                applyPageParam: ({ pageParam, input }) => {
                  if (pageParam === undefined) {
                    return {
                      ...input,
                      page: 2n,
                    };
                  }
                  return {
                    ...input,
                    page: pageParam,
                  };
                },
                getNextPageParam: (lastPage) => lastPage.page + 1n,
                transport,
                callOptions: mockCallOptions,
              },
            ),
          ),
        wrapper({ defaultOptions }),
      );

      expect(transportSpy).toHaveBeenCalledWith(
        expect.anything(), // service
        expect.anything(), // method
        mockCallOptions.signal, // signal
        mockCallOptions.timeoutMs, // timeoutMs
        mockCallOptions.headers, // headers
        expect.objectContaining({
          page: 2n,
        }), // input
      );
    });
  });

  describe('useMutation', () => {
    it('prioritizes option transport', async () => {
      const mockTransportContext = mockEliza();
      const mockTransportTopLevel = mockEliza();
      const mockTransportOption = mockEliza({
        sentence: 'mockTransportOption',
      });

      const customSay = unaryHooks({
        methodInfo: ElizaService.methods.say,
        typeName: ElizaService.typeName,
        transport: mockTransportTopLevel,
      });
      const { result } = renderHook(
        () =>
          useMutation(
            customSay.useMutation({ transport: mockTransportOption }),
          ),
        wrapper({}, mockTransportContext),
      );

      result.current.mutate({});

      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(result.current.data).toMatchObject({
        sentence: 'mockTransportOption',
      });
    });

    it('has the intended API surface', () => {
      type params = Parameters<typeof genCount.useMutation>;

      type ExpectType_UseMutationParamsLength = Expect<
        Equal<params['length'], 0 | 1>
      >;

      type ExpectType_UseMutationParams0 = Expect<
        Equal<
          params[0],
          | {
              onError?: (error: ConnectError) => void;
              transport?: Transport | undefined;
              callOptions?: CallOptions | undefined;
            }
          | undefined
        >
      >;

      type ExpectType_UseMutationReturn = Expect<
        Equal<
          ReturnType<typeof genCount.useMutation>,
          {
            mutationFn: (
              input: PartialMessage<CountRequest>,
              context?:
                | QueryFunctionContext<ConnectQueryKey<CountRequest>>
                | undefined,
            ) => Promise<CountResponse>;
            onError?: (error: ConnectError) => void;
          }
        >
      >;

      const { result } = renderHook(() => genCount.useMutation(), wrapper());

      expect(
        Object.keys(result.current).sort((a, b) => a.localeCompare(b)),
      ).toStrictEqual(['mutationFn']);
    });

    it('handles a custom onError', async () => {
      jest.resetAllMocks();
      const onError = jest.fn();

      const { result, rerender } = renderHook(
        () =>
          useMutation({
            ...genCount.useMutation({ onError }),
            mutationFn: async () => Promise.reject('error'),
            mutationKey: genCount.getQueryKey(),
          }),
        wrapper({ defaultOptions }, mockBigInt()),
      );

      rerender();

      expect(result.current.error).toStrictEqual(null);
      expect(result.current.isError).toStrictEqual(false);
      expect(onError).toHaveBeenCalledTimes(0);
      expect(consoleErrorSpy).toHaveBeenCalled();

      type ExpectType_Error = Expect<
        Equal<typeof result.current.error, ConnectError | null>
      >;

      result.current.mutate();

      await sleep(10);

      expect(result.current.error).toStrictEqual('error');
      expect(result.current.isError).toStrictEqual(true);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('error');
    });

    it('makes a mutation', async () => {
      /** this input will add one to the total count */
      const input = { add: 2n };

      const { queryClient, ...rest } = wrapper(
        { defaultOptions },
        mockStatefulBigIntTransport(),
      );

      const { result } = renderHook(
        () => ({
          mut: useMutation({
            ...genCount.useMutation(),
            mutationKey: genCount.getQueryKey(input),
            onSuccess: () => {
              const queryKey = genCount.getQueryKey(input);
              const { count = 0n } =
                queryClient.getQueryData<CountResponse>(queryKey) ?? {};

              queryClient.setQueryData(
                ...genCount.setQueryData({ count: count + input.add }, input),
              );
            },
          }),
          get: useQuery(genCount.useQuery(input)),
        }),
        rest,
      );

      type ExpectType_MutationFn = Expect<
        Equal<
          typeof result.current.mut,
          UseMutationResult<
            CountResponse,
            ConnectError,
            PartialMessage<CountRequest>
          >
        >
      >;
      expect(result.current.mut.data?.count).toStrictEqual(undefined);
      expect(result.current.get.data?.count).toStrictEqual(undefined);

      await waitFor(() => {
        expect(result.current.mut.isIdle).toBeTruthy();
        expect(result.current.get.isSuccess).toBeTruthy();
      });

      expect(result.current.mut.data?.count).toStrictEqual(undefined);
      expect(result.current.get.data?.count).toStrictEqual(2n);

      result.current.mut.mutate(input);

      await waitFor(() => {
        expect(result.current.mut.isSuccess).toBeTruthy();
        expect(result.current.get.isSuccess).toBeTruthy();
      });

      expect(result.current.mut.data?.count).toStrictEqual(4n);
      expect(result.current.get.data?.count).toStrictEqual(4n);
    });

    it('passes through callOptions', async () => {
      const transport = mockBigInt();
      const transportSpy = jest.spyOn(transport, 'unary');
      const { result } = renderHook(
        () =>
          useMutation({
            ...genCount.useMutation({
              callOptions: mockCallOptions,
              transport,
            }),
            mutationKey: genCount.getQueryKey({ add: 1n }),
          }),
        wrapper({ defaultOptions }),
      );

      result.current.mutate({ add: 2n });

      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(transportSpy).toHaveBeenCalledWith(
        expect.anything(), // service
        expect.anything(), // method
        mockCallOptions.signal, // signal
        mockCallOptions.timeoutMs, // timeoutMs
        mockCallOptions.headers, // headers
        expect.anything(), // input
      );
    });
  });

  describe('useQuery', () => {
    it('has the intended API surface', () => {
      type params = Parameters<typeof genSay.useQuery>;
      type ExpectType_UseQueryParams0 = Expect<
        Equal<
          params[0],
          PartialMessage<SayRequest> | typeof disableQuery | undefined
        >
      >;

      type ExpectType_UseQueryParams1 = Expect<
        Equal<
          params[1],
          | {
              getPlaceholderData?: (
                enabled: boolean,
              ) => PartialMessage<SayResponse> | undefined;
              onError?: (error: ConnectError) => void;
              transport?: Transport | undefined;
              callOptions?: CallOptions | undefined;
            }
          | undefined
        >
      >;

      type ExpectType_UseQueryParams2 = Expect<
        Equal<params['length'], 0 | 1 | 2>
      >;

      type ExpectType_UseQueryK = Expect<
        Equal<
          ReturnType<typeof genSay.useQuery>,
          {
            enabled: boolean;
            queryKey: ConnectQueryKey<SayRequest>;
            queryFn: (
              context?: QueryFunctionContext<ConnectQueryKey<SayRequest>>,
            ) => Promise<SayResponse>;
            placeholderData?: () => SayResponse | undefined;
            onError?: (error: ConnectError) => void;
          }
        >
      >;

      const { result } = renderHook(
        () =>
          genSay.useQuery(undefined, {
            onError: jest.fn(),
            getPlaceholderData: jest.fn(() => new SayResponse()),
          }),
        wrapper(),
      );

      expect(
        Object.keys(result.current).sort((a, b) => a.localeCompare(b)),
      ).toStrictEqual([
        'enabled',
        'onError',
        'placeholderData',
        'queryFn',
        'queryKey',
      ]);
    });

    describe('transport', () => {
      it('prioritizes option transport', async () => {
        const mockTransportContext = mockEliza();
        const mockTransportTopLevel = mockEliza();
        const mockTransportOption = mockEliza({
          sentence: 'override',
        });
        const input = { sentence: 'useQuery' };
        const customSay = unaryHooks({
          methodInfo: ElizaService.methods.say,
          typeName: ElizaService.typeName,
          transport: mockTransportTopLevel,
        });
        const { result } = renderHook(
          () =>
            useQuery(
              customSay.useQuery(input, { transport: mockTransportOption }),
            ),
          wrapper({}, mockTransportContext),
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBeTruthy();
        });

        expect(result.current.data?.sentence).toStrictEqual('override');
      });
    });

    describe('enabled', () => {
      it('has the correct type', () => {
        expect.assertions(0);
        const { result } = renderHook(() => genSay.useQuery({}), wrapper());
        type ExpectType_Expect = Expect<
          Equal<typeof result.current.enabled, boolean>
        >;
      });

      it('is enabled when input does not match the `disableQuery` symbol', () => {
        const { result } = renderHook(() => genSay.useQuery({}), wrapper());

        expect(result.current).toHaveProperty('enabled', true);
      });

      it('is enabled with an empty input', () => {
        const { result } = renderHook(() => genSay.useQuery(), wrapper());

        expect(result.current).toHaveProperty('enabled', true);
      });

      it('is disabled when input matches the `disableQuery` symbol', () => {
        const { result } = renderHook(
          () => genSay.useQuery(disableQuery),
          wrapper(),
        );

        expect(result.current).toHaveProperty('enabled', false);
      });
    });

    describe('placeholderData', () => {
      const placeholderSentence: PartialMessage<SayResponse> = {
        sentence: 'placeholder',
      };

      const input: PartialMessage<SayRequest> = { sentence: 'ziltoid' };

      it('has the correct type', () => {
        expect.assertions(0);
        const { result } = renderHook(() => genSay.useQuery(), wrapper());
        type ExpectType_GetPlaceholderData = Expect<
          Equal<
            typeof result.current.placeholderData,
            (() => SayResponse | undefined) | undefined
          >
        >;
      });

      it('passes through getPlaceholderData, when provided', () => {
        const getPlaceholderData = jest.fn(() => placeholderSentence);
        const { result } = renderHook(
          () => genSay.useQuery(input, { getPlaceholderData }),
          wrapper(),
        );

        expect(result.current).toHaveProperty(
          'placeholderData',
          expect.any(Function),
        );
        expect(getPlaceholderData).not.toHaveBeenCalled();

        const response = (
          result.current.placeholderData as () => Message<SayResponse>
        )();

        expect(getPlaceholderData).toHaveBeenCalledWith(true);
        expect(response.toJson()).toStrictEqual(placeholderSentence);
        expect(response).toBeInstanceOf(SayResponse);
      });

      it('does not pass through getPlaceholderData if not provided', () => {
        const { result } = renderHook(() => genSay.useQuery(input), wrapper());

        expect(result.current).not.toHaveProperty('getPlaceholderData');
      });

      it('will use pass the value of `enabled` to the getPlaceholderData callback', () => {
        const getPlaceholderData = jest.fn<
          (
            enabled?: boolean | undefined,
          ) => PartialMessage<SayResponse> | undefined
        >(() => ({}));
        const { result } = renderHook(
          () => useQuery(genSay.useQuery(disableQuery, { getPlaceholderData })),
          wrapper(),
        );

        expect(result.current.data?.sentence).toStrictEqual('');
        expect(getPlaceholderData).toHaveBeenCalledWith(false);
      });

      it('will be undefined if getPlaceholderData returns undefined', () => {
        const getPlaceholderData = jest.fn<
          (
            enabled?: boolean | undefined,
          ) => PartialMessage<SayResponse> | undefined
        >(() => undefined);
        const { result } = renderHook(
          () => useQuery(genSay.useQuery(disableQuery, { getPlaceholderData })),
          wrapper(),
        );

        expect(result.current.data?.sentence).toStrictEqual(undefined);
        expect(getPlaceholderData).toHaveBeenCalledWith(false);
      });
    });

    describe('onError', () => {
      beforeEach(() => {
        consoleErrorSpy.mockReset();
      });
      afterAll(() => {
        consoleErrorSpy.mockReset();
      });

      it("doesn't use onError if it isn't passed", () => {
        const { result } = renderHook(() => genSay.useQuery(), wrapper());
        expect(result.current.onError).toBeUndefined();
      });

      it('allows for a passthrough onError', async () => {
        const onError = jest.fn();
        const { result, rerender } = renderHook(
          () =>
            useQuery({
              // @ts-expect-error(2345) intentionally invalid input
              ...genSay.useQuery({ nope: 'nope nope' }, { onError }),
              queryFn: async () => Promise.reject('error'),
              retry: false,
            }),
          wrapper(),
        );
        rerender();

        expect(result.current.error).toStrictEqual(null);
        expect(result.current.isError).toStrictEqual(false);
        expect(onError).toHaveBeenCalledTimes(0);
        expect(consoleErrorSpy).not.toHaveBeenCalled();

        await sleep(10);

        expect(result.current.error).toStrictEqual('error');
        expect(result.current.isError).toStrictEqual(true);
        expect(onError).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('error');
      });
    });

    describe('queryFn', () => {
      const input: PartialMessage<SayRequest> = { sentence: 'ziltoid' };

      it('has the correct type', () => {
        expect.assertions(0);
        const { result } = renderHook(() => genSay.useQuery(), wrapper());
        type ExpectType_QueryFn = Expect<
          Equal<
            typeof result.current.queryFn,
            (
              context?:
                | QueryFunctionContext<ConnectQueryKey<SayRequest>>
                | undefined,
            ) => Promise<SayResponse>
          >
        >;
      });

      it('generates a query function', () => {
        const { result } = renderHook(() => genSay.useQuery(input), wrapper());

        expect(result.current).toHaveProperty('queryFn', expect.any(Function));
      });

      it('throws when the `queryFn` is passed `disabledQuery` symbol as an input', async () => {
        const { result } = renderHook(
          () => genSay.useQuery(disableQuery),
          wrapper(),
        );

        await expect(result.current.queryFn).rejects.toStrictEqual(
          new Error(
            'Invalid assertion: queryFn does not accept a disabled query',
          ),
        );
      });

      it('passes through callOptions', () => {
        const transport = mockEliza();
        const transportSpy = jest.spyOn(transport, 'unary');
        renderHook(
          () =>
            useQuery(
              genSay.useQuery(
                {},
                {
                  transport,
                  callOptions: mockCallOptions,
                },
              ),
            ),
          wrapper(),
        );

        expect(transportSpy).toHaveBeenCalledWith(
          expect.anything(), // service
          expect.anything(), // method
          mockCallOptions.signal, // signal
          mockCallOptions.timeoutMs, // timeoutMs
          mockCallOptions.headers, // headers
          expect.anything(), // input
        );
      });
    });

    describe('queryKey', () => {
      const input: PartialMessage<SayRequest> = { sentence: 'ziltoid' };

      it('has the correct type', () => {
        expect.assertions(0);
        const { result } = renderHook(() => genSay.useQuery(), wrapper());
        type ExpectType_QueryKey = Expect<
          Equal<
            typeof result.current.queryKey,
            [string, string, PartialMessage<SayRequest>]
          >
        >;
      });

      it('generates a query key', () => {
        const { result } = renderHook(() => genSay.useQuery(input), wrapper());

        expect(result.current).toHaveProperty('queryKey', [
          ElizaService.typeName,
          ElizaService.methods.say.name,
          { sentence: 'ziltoid' },
        ]);
      });
    });
  });
});
