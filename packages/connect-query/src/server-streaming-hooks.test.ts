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

import type { PartialMessage } from '@bufbuild/protobuf';
import { describe, expect, it, jest } from '@jest/globals';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import {
  ElizaService,
  PaginatedService,
} from 'generated-react/dist/eliza_connect';
import type { IntroduceRequest } from 'generated-react/dist/eliza_pb';
import { IntroduceResponse, ListResponse } from 'generated-react/dist/eliza_pb';

import type { ConnectQueryKey } from './connect-query-key';
import { defaultOptions } from './default-options';
import type { Equal, Expect } from './jest/test-utils';
import {
  mockEliza,
  mockElizaIntroduceError,
  mockPaginatedTransport,
  wrapper,
} from './jest/test-utils';
import {
  serverStreamingHooks,
  type StreamResponseMessage,
} from './server-streaming-hooks';
import type { DisableQuery } from './utils';
import { disableQuery } from './utils';

const genIntroduce = serverStreamingHooks({
  methodInfo: ElizaService.methods.introduce,
  typeName: ElizaService.typeName,
});

const genPaginated = serverStreamingHooks({
  methodInfo: PaginatedService.methods.streamingList,
  typeName: PaginatedService.typeName,
});

describe('serverStreamingHooks', () => {
  describe('createData', () => {
    it('creates data as expected', () => {
      const partial: PartialMessage<IntroduceResponse> = {
        sentence: "Hello, I'm Eliza.",
      };
      const expected = new ElizaService.methods.introduce.O(partial);

      expect(genIntroduce.createData(partial)).toStrictEqual(expected);
    });
  });

  // note: the bulk of this helper is tested via the API's main entry point: `useQuery`, which simply calls this function with automatic inference of transport.
  describe('createUseQueryOptions', () => {
    it('requires transport', () => {
      const message =
        'createUseQueryOptions requires you to provide a Transport.  If you want automatic inference of Transport, try using the useQuery helper.';
      expect(() =>
        genIntroduce.createUseQueryOptions(
          {},
          {
            // @ts-expect-error(2322) intentionally incorrect
            transport: undefined,
          },
        ),
      ).toThrow(`Invalid assertion: ${message}`);
      expect(() =>
        genIntroduce.createUseQueryOptions(
          {},
          // @ts-expect-error(2322) intentionally incorrect
          {},
        ),
      ).toThrow(`Invalid assertion: ${message}`);
    });
  });

  describe('getPartialQueryKey', () => {
    it('returns a partial query key', () => {
      expect(genIntroduce.getPartialQueryKey()).toStrictEqual([
        'connectrpc.eliza.v1.ElizaService',
        'Introduce',
      ]);
    });
  });

  describe('getQueryKey', () => {
    type ExpectType_GetQuery = Expect<
      Equal<
        typeof genIntroduce.getQueryKey,
        (
          input?: DisableQuery | PartialMessage<IntroduceRequest>,
        ) => ConnectQueryKey<IntroduceRequest>
      >
    >;

    it('returns a simple query key with an input', () => {
      const request = { name: 'ziltoid' };
      expect(genIntroduce.getQueryKey(request)).toStrictEqual([
        'connectrpc.eliza.v1.ElizaService',
        'Introduce',
        request,
      ]);
    });

    it('returns handles disableQuery', () => {
      expect(genIntroduce.getQueryKey(disableQuery)).toStrictEqual([
        'connectrpc.eliza.v1.ElizaService',
        'Introduce',
        {},
      ]);
    });

    it('returns handles no input', () => {
      expect(genIntroduce.getQueryKey()).toStrictEqual([
        'connectrpc.eliza.v1.ElizaService',
        'Introduce',
        {},
      ]);
      expect(genIntroduce.getQueryKey(undefined)).toStrictEqual([
        'connectrpc.eliza.v1.ElizaService',
        'Introduce',
        {},
      ]);
      // @ts-expect-error(2345) intentionally incorrect
      expect(genIntroduce.getQueryKey(null)).toStrictEqual([
        'connectrpc.eliza.v1.ElizaService',
        'Introduce',
        {},
      ]);
    });
  });

  describe('setQueriesData & setQueryData', () => {
    const partialUpdater = {
      done: true,
      responses: [
        {
          sentence: 'Updated!',
        },
      ],
    };

    const request = { name: 'ziltoid' };

    describe('setQueriesData', () => {
      it('returns the correct queryKey', () => {
        const [queryKey] = genIntroduce.setQueriesData({
          done: true,
          responses: [
            {
              sentence: "Hello, I'm Eliza.",
            },
          ],
        });
        expect(queryKey).toStrictEqual([
          'connectrpc.eliza.v1.ElizaService',
          'Introduce',
        ]);
      });

      it('allows a partial message updater', async () => {
        const transport = mockEliza();
        const { queryClient, ...rest } = wrapper({ defaultOptions });

        const { result, rerender } = renderHook(
          () => useQuery(genIntroduce.useQuery(request, { transport })),
          rest,
        );
        type ExpectType_Data = Expect<
          Equal<
            typeof result.current.data,
            StreamResponseMessage<IntroduceResponse> | undefined
          >
        >;

        await waitFor(() => {
          expect(result.current.data?.done).toBeTruthy();
        });

        queryClient.setQueriesData(
          ...genIntroduce.setQueriesData(partialUpdater),
        );
        rerender();

        // this value comes from the partial updater
        expect(result.current.data?.responses).toStrictEqual([
          new IntroduceResponse(partialUpdater.responses[0]),
        ]);
      });
    });

    describe('setQueryData', () => {
      it('returns the correct queryKey', () => {
        const [queryKey] = genIntroduce.setQueryData(partialUpdater, request);
        type ExpectType_QueryKey = Expect<
          Equal<typeof queryKey, ConnectQueryKey<IntroduceRequest>>
        >;
        expect(queryKey).toStrictEqual([
          'connectrpc.eliza.v1.ElizaService',
          'Introduce',
          request,
        ]);
      });

      it('allows a partial message updater', async () => {
        const { queryClient, ...rest } = wrapper(
          { defaultOptions },
          mockEliza(),
        );

        const { result, rerender } = renderHook(
          () => useQuery(genIntroduce.useQuery(request)),
          rest,
        );

        await waitFor(() => {
          expect(result.current.data?.done).toBeTruthy();
        });

        expect(result.current.data?.responses).toStrictEqual([
          new IntroduceResponse({
            sentence: 'Hello',
          }),
          new IntroduceResponse({
            sentence: 'World',
          }),
        ]);

        queryClient.setQueryData(
          ...genIntroduce.setQueryData(partialUpdater, request),
        );
        rerender();

        // this value comes from the partial updater
        expect(result.current.data?.responses).toStrictEqual([
          new IntroduceResponse({
            sentence: 'Updated!',
          }),
        ]);
      });

      it('allows a function updater', async () => {
        const { queryClient, ...rest } = wrapper(
          { defaultOptions },
          mockEliza(),
        );
        const { result, rerender } = renderHook(
          () => useQuery(genIntroduce.useQuery(request)),
          rest,
        );

        type ExpectType_Data = Expect<
          Equal<
            typeof result.current.data,
            StreamResponseMessage<IntroduceResponse> | undefined
          >
        >;

        await waitFor(() => {
          expect(result.current.data?.done).toBeTruthy();
        });

        expect(result.current.data?.responses).toEqual([
          {
            sentence: 'Hello',
          },
          {
            sentence: 'World',
          },
        ]);

        queryClient.setQueryData(
          ...genIntroduce.setQueryData(() => {
            return {
              done: true,
              responses: [
                {
                  sentence: 'Preset!',
                },
              ],
            };
          }, request),
        );
        rerender();

        // this value comes from the partial updater
        expect(result.current.data?.responses).toStrictEqual([
          new IntroduceResponse({
            sentence: 'Preset!',
          }),
        ]);
      });
    });
  });

  describe('useInfiniteQuery', () => {
    it('responses are nested within pages', async () => {
      const context = wrapper({ defaultOptions }, mockPaginatedTransport());

      const { result } = renderHook(
        () =>
          useInfiniteQuery(
            genPaginated.useInfiniteQuery(
              {},
              {
                pageParamKey: 'page',
                getNextPageParam: (lastPage) => lastPage.responses[0].page + 1n,
              },
            ),
          ),
        context,
      );

      // Wait for first response
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(result.current.data?.pages).toStrictEqual([
        {
          done: false,
          responses: [
            new ListResponse({
              items: ['-2 Item', '-1 Item'],
              page: 0n,
            }),
          ],
        },
      ]);

      // Wait for all responses
      await waitFor(() => {
        expect(result.current.data?.pages[0]?.done).toBeTruthy();
      });

      expect(result.current.data?.pages).toStrictEqual([
        {
          done: true,
          responses: [
            new ListResponse({
              items: ['-2 Item', '-1 Item'],
              page: 0n,
            }),
            new ListResponse({
              items: ['0 Item'],
              page: 0n,
            }),
          ],
        },
      ]);

      await result.current.fetchNextPage();

      expect(result.current.data?.pages[1]).toStrictEqual({
        done: false,
        responses: [
          new ListResponse({
            items: ['1 Item', '2 Item'],
            page: 1n,
          }),
        ],
      });
    });
  });

  describe('useQuery', () => {
    it('returns placeholder data when fetching', async () => {
      const context = wrapper({ defaultOptions }, mockEliza());

      const { result } = renderHook(
        () =>
          useQuery(
            genIntroduce.useQuery(
              {
                name: 'ziltoid',
              },
              {
                getPlaceholderData: () => ({
                  sentence: 'Placeholder...',
                }),
              },
            ),
          ),
        context,
      );

      expect(result.current.data).toEqual({
        done: false,
        responses: [
          {
            sentence: 'Placeholder...',
          },
        ],
      });

      await waitFor(() => {
        expect(result.current.data?.done).toBeTruthy();
      });
    });

    it('handles custom onError', async () => {
      const context = wrapper({ defaultOptions }, mockElizaIntroduceError());

      const spy = jest.fn();

      const { result } = renderHook(
        () =>
          useQuery(
            genIntroduce.useQuery(
              {
                name: 'ziltoid',
              },
              {
                onError: (error) => {
                  console.log({ error });
                  spy(error);
                },
              },
            ),
          ),
        context,
      );
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });
      expect(spy).toHaveBeenCalledWith(new Error());
    });
  });

  describe('useMutation', () => {
    it('returns the aggregated data', async () => {
      const context = wrapper({ defaultOptions }, mockEliza());

      const { result } = renderHook(
        () => useMutation(genIntroduce.useMutation()),
        context,
      );

      // Wait for first response
      const mutationResult = await result.current.mutateAsync({
        name: 'ziltoid',
      });

      expect(mutationResult).toStrictEqual({
        done: true,
        responses: [
          new IntroduceResponse({
            sentence: 'Hello',
          }),
          new IntroduceResponse({
            sentence: 'World',
          }),
        ],
      });
    });
  });
});
