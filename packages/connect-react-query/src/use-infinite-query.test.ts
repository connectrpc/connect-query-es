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

import { describe, expect, it } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";

import { createConnectQueryKey } from "./connect-query-key";
import { defaultOptions } from "./default-options";
import { PaginatedService } from "./gen/eliza_connect";
import { mockPaginatedTransport, wrapper } from "./jest/test-utils";
import { useInfiniteQuery } from "./use-infinite-query";
import { disableQuery } from "./utils";

// TODO: maybe create a helper to take a service and method and generate this.
const methodDescriptor = {
  ...PaginatedService.methods.list,
  localName: "List",
  service: {
    typeName: PaginatedService.typeName,
  },
};

const mockedPaginatedTransport = mockPaginatedTransport();

describe("useInfiniteQuery", () => {
  it("can query paginated data", async () => {
    const { result } = renderHook(
      () => {
        return useInfiniteQuery(
          methodDescriptor,
          {
            page: 0n,
          },
          {
            getNextPageParam: (lastPage) => lastPage.page + 1n,
            pageParamKey: "page",
          }
        );
      },
      wrapper(
        {
          defaultOptions,
        },
        mockedPaginatedTransport
      )
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });
    expect(result.current.data).toEqual({
      pageParams: [0n],
      pages: [
        {
          items: ["-2 Item", "-1 Item", "0 Item"],
          page: 0n,
        },
      ],
    });

    await result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.isFetching).toBeFalsy();
    });

    expect(result.current.data).toEqual({
      pageParams: [0n, 1n],
      pages: [
        {
          items: ["-2 Item", "-1 Item", "0 Item"],
          page: 0n,
        },
        {
          items: ["1 Item", "2 Item", "3 Item"],
          page: 1n,
        },
      ],
    });
  });

  it("can be disabled", () => {
    const { result } = renderHook(
      () => {
        return useInfiniteQuery(methodDescriptor, disableQuery, {
          getNextPageParam: (lastPage) => lastPage.page + 1n,
          pageParamKey: "page",
        });
      },
      wrapper(undefined, mockedPaginatedTransport)
    );
    expect(result.current.isPending).toBeTruthy();
    expect(result.current.isFetching).toBeFalsy();
  });

  it("can be provided a custom transport", async () => {
    const { result } = renderHook(
      () => {
        return useInfiniteQuery(
          methodDescriptor,
          {
            page: 0n,
          },
          {
            getNextPageParam: (lastPage) => lastPage.page + 1n,
            pageParamKey: "page",
            transport: mockPaginatedTransport({
              items: ["Intercepted!"],
              page: 0n,
            }),
          }
        );
      },
      wrapper(
        {
          defaultOptions,
        },
        mockedPaginatedTransport
      )
    );
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(result.current.data?.pages[0].items).toEqual(["Intercepted!"]);
  });

  it("can be provided other props for react-query", () => {
    const { result } = renderHook(
      () => {
        return useInfiniteQuery(
          methodDescriptor,
          {
            page: 0n,
          },
          {
            getNextPageParam: (lastPage) => lastPage.page + 1n,
            pageParamKey: "page",
            transport: mockPaginatedTransport(undefined, true),
            placeholderData: {
              pageParams: [-1n],
              pages: [
                new methodDescriptor.O({
                  page: -1n,
                  items: [],
                }),
              ],
            },
          }
        );
      },
      wrapper(
        {
          defaultOptions,
        },
        mockedPaginatedTransport
      )
    );
    expect(result.current.data?.pages[0].page).toEqual(-1n);
  });

  it("page param doesn't persist to the query cache", () => {
    const { queryClient, ...remainingWrapper } = wrapper(
      {
        defaultOptions,
      },
      mockedPaginatedTransport
    );
    const { result } = renderHook(() => {
      return useInfiniteQuery(
        methodDescriptor,
        {
          page: 0n,
        },
        {
          getNextPageParam: (lastPage) => lastPage.page + 1n,
          pageParamKey: "page",
        }
      );
    }, remainingWrapper);

    const cache = queryClient.getQueryCache().getAll();
    console.log({
      cacheKey: cache[0].queryKey,
    });
    expect(cache).toHaveLength(1);
    expect(cache[0].queryKey).toEqual(
      createConnectQueryKey(methodDescriptor, { page: 0n })
    );
    expect(result.current.data).toEqual(0n);
  });
});
