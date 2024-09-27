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

import { create } from "@bufbuild/protobuf";
import { QueryCache, skipToken } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  createConnectInfiniteQueryKey,
  createConnectQueryKey,
} from "./connect-query-key.js";
import { defaultOptions } from "./default-options.js";
import { ListResponseSchema, ListService } from "./gen/list_pb.js";
import { mockPaginatedTransport, wrapper } from "./test/test-utils.js";
import {
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
} from "./use-infinite-query.js";
import { useQuery } from "./use-query.js";

// TODO: maybe create a helper to take a service and method and generate this.
const methodDescriptor = ListService.method.list;

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
          },
        );
      },
      wrapper(
        {
          defaultOptions,
        },
        mockedPaginatedTransport,
      ),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });
    expect(result.current.data).toEqual({
      pageParams: [0n],
      pages: [
        create(ListResponseSchema, {
          items: ["-2 Item", "-1 Item", "0 Item"],
          page: 0n,
        }),
      ],
    });

    await result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.isFetching).toBeFalsy();
    });

    expect(result.current.data).toEqual({
      pageParams: [0n, 1n],
      pages: [
        create(ListResponseSchema, {
          items: ["-2 Item", "-1 Item", "0 Item"],
          page: 0n,
        }),
        create(ListResponseSchema, {
          items: ["1 Item", "2 Item", "3 Item"],
          page: 1n,
        }),
      ],
    });
  });

  it("can be disabled with skipToken", () => {
    const { result } = renderHook(
      () => {
        return useInfiniteQuery(methodDescriptor, skipToken, {
          getNextPageParam: (lastPage) => lastPage.page + 1n,
          pageParamKey: "page",
        });
      },
      wrapper(undefined, mockedPaginatedTransport),
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
          },
        );
      },
      wrapper(
        {
          defaultOptions,
        },
        mockedPaginatedTransport,
      ),
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
                create(methodDescriptor.output, {
                  page: -1n,
                  items: [],
                }),
              ],
            },
          },
        );
      },
      wrapper(
        {
          defaultOptions,
        },
        mockedPaginatedTransport,
      ),
    );
    expect(result.current.data?.pages[0].page).toEqual(-1n);
  });

  it("page param doesn't persist to the query cache", async () => {
    const { queryClient, ...remainingWrapper } = wrapper(
      {
        defaultOptions,
      },
      mockedPaginatedTransport,
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
        },
      );
    }, remainingWrapper);

    const cache = queryClient.getQueryCache().getAll();

    expect(cache).toHaveLength(1);
    expect(cache[0].queryKey).toEqual(
      createConnectInfiniteQueryKey(methodDescriptor, {}),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(result.current.data?.pageParams[0]).toEqual(0n);
  });

  it("doesn't share data with a similar non-infinite query", async () => {
    const remainingWrapper = wrapper(
      {
        defaultOptions,
      },
      mockedPaginatedTransport,
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
        },
      );
    }, remainingWrapper);
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });
    expect(result.current.data?.pages[0].items).toHaveLength(3);

    const { result: useQueryResult } = renderHook(() => {
      // @ts-expect-error(2345) this exception is intentional to simulate a pagination query
      // that's based on a string | undefined page param.
      return useQuery(methodDescriptor, {
        page: undefined,
      });
    }, remainingWrapper);

    await waitFor(() => {
      expect(useQueryResult.current.isSuccess).toBeTruthy();
    });

    expect(useQueryResult.current.data?.items).toHaveLength(3);
  });

  it("cache can be invalidated with the shared, non-infinite key", async () => {
    const onSuccessSpy = vi.fn();
    const spiedQueryCache = new QueryCache({
      onSuccess: onSuccessSpy,
    });
    const { queryClient, ...remainingWrapper } = wrapper(
      {
        defaultOptions,
        queryCache: spiedQueryCache,
      },
      mockedPaginatedTransport,
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
        },
      );
    }, remainingWrapper);

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(onSuccessSpy).toHaveBeenCalledTimes(1);

    await queryClient.invalidateQueries({
      queryKey: createConnectQueryKey(methodDescriptor),
    });

    expect(onSuccessSpy).toHaveBeenCalledTimes(2);
  });
});

describe("useSuspenseInfiniteQuery", () => {
  it("can query paginated data", async () => {
    const { result } = renderHook(
      () => {
        return useSuspenseInfiniteQuery(
          methodDescriptor,
          {
            page: 0n,
          },
          {
            getNextPageParam: (lastPage) => lastPage.page + 1n,
            pageParamKey: "page",
          },
        );
      },
      wrapper(
        {
          defaultOptions,
        },
        mockedPaginatedTransport,
      ),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });
    expect(result.current.data).toEqual({
      pageParams: [0n],
      pages: [
        create(ListResponseSchema, {
          items: ["-2 Item", "-1 Item", "0 Item"],
          page: 0n,
        }),
      ],
    });

    await result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.isFetching).toBeFalsy();
    });

    expect(result.current.data).toEqual({
      pageParams: [0n, 1n],
      pages: [
        create(ListResponseSchema, {
          items: ["-2 Item", "-1 Item", "0 Item"],
          page: 0n,
        }),
        create(ListResponseSchema, {
          items: ["1 Item", "2 Item", "3 Item"],
          page: 1n,
        }),
      ],
    });
  });

  it("can be disabled without explicit disableQuery", () => {
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
            enabled: false,
          },
        );
      },
      wrapper(
        {
          defaultOptions,
        },
        mockedPaginatedTransport,
      ),
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isPending).toBeTruthy();
    expect(result.current.isFetching).toBeFalsy();
  });

  it("does not allow excess properties", () => {
    renderHook(
      () => {
        return useInfiniteQuery(
          methodDescriptor,
          {
            page: 0n,
            // @ts-expect-error(2345) extra fields should not be allowed
            extraField: "extra",
          },
          {
            getNextPageParam: (lastPage) => lastPage.page + 1n,
            pageParamKey: "page",
          },
        );
      },
      wrapper(
        {
          defaultOptions,
        },
        mockedPaginatedTransport,
      ),
    );
  });
});
