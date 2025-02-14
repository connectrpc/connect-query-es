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

import { type MessageShape } from "@bufbuild/protobuf";
import type { Query } from "@tanstack/query-core";
import { mockEliza, mockPaginatedTransport } from "test-utils";
import type { SayResponseSchema } from "test-utils/gen/eliza_pb.js";
import { ElizaService } from "test-utils/gen/eliza_pb.js";
import { ListService } from "test-utils/gen/list_pb.js";
import { describe, expect, it } from "vitest";

import { createConnectQueryKey } from "./connect-query-key.js";
import { QueryClient } from "./query-client.js";

const sayMethodDescriptor = ElizaService.method.say;

const mockedElizaTransport = mockEliza();

const paginatedTransport = mockPaginatedTransport();

const queryDetails = {
  schema: sayMethodDescriptor,
  input: {
    sentence: "Pablo",
  },
  transport: mockedElizaTransport,
};

describe("prefetch APIs", () => {
  it("populates a single query cache", async () => {
    const queryClient = new QueryClient();
    const currentCacheItems = queryClient.getQueryCache().findAll();
    expect(currentCacheItems).toHaveLength(0);

    await queryClient.prefetchConnectQuery(
      queryDetails.schema,
      queryDetails.input,
      { transport: queryDetails.transport },
    );
    const item = queryClient.getConnectQueryData({
      ...queryDetails,
      cardinality: "finite",
    });
    expect(item.sentence).toBe("Hello Pablo");

    const queryState = queryClient.getConnectQueryState({
      ...queryDetails,
      cardinality: "finite",
    });
    expect(queryState.status).toBe("success");
    expect(queryState.fetchStatus).toBe("idle");
    expect(queryState.dataUpdateCount).toBe(1);
  });

  it("populates an infinite query cache", async () => {
    const queryClient = new QueryClient();
    const currentCacheItems = queryClient.getQueryCache().findAll();
    expect(currentCacheItems).toHaveLength(0);

    await queryClient.prefetchConnectInfiniteQuery(
      ListService.method.list,
      {
        preview: true,
        page: 0n,
      },
      {
        transport: paginatedTransport,
        pageParamKey: "page",
        getNextPageParam: (data) => data.page,
      },
    );

    const details = {
      schema: ListService.method.list,
      transport: paginatedTransport,
      input: {
        preview: true,
      },
      cardinality: "infinite" as const,
    };

    const item = queryClient.getConnectQueryData(details);

    const nextItems = queryClient.getQueryCache().findAll();
    expect(nextItems).toHaveLength(1);
    expect(item.pages[0].items).toHaveLength(3);

    const queryState = queryClient.getConnectQueryState(details);
    expect(queryState.status).toBe("success");
    expect(queryState.fetchStatus).toBe("idle");
    expect(queryState.dataUpdateCount).toBe(1);
  });
});

describe("invalidateConnectQueries", () => {
  it("invalidates a specific query", async () => {
    const queryClient = new QueryClient();
    await queryClient.prefetchConnectQuery(
      queryDetails.schema,
      queryDetails.input,
      { transport: queryDetails.transport },
    );
    await queryClient.invalidateConnectQueries(queryDetails);
    const queryState = queryClient.getConnectQueryState({
      ...queryDetails,
      cardinality: "finite",
    });
    expect(queryState.isInvalidated).toBe(true);
  });

  it("invalidate all methods for a given service", async () => {
    const queryClient = new QueryClient();
    await queryClient.prefetchConnectQuery(
      queryDetails.schema,
      queryDetails.input,
      { transport: queryDetails.transport },
    );

    await queryClient.invalidateConnectQueries({
      schema: ElizaService,
      transport: mockedElizaTransport,
    });
    const queryState = queryClient.getConnectQueryState({
      ...queryDetails,
      cardinality: "finite",
    });
    expect(queryState.isInvalidated).toBe(true);
  });
});

describe("refetchConnectQueries", () => {
  it("refetch a specific query", async () => {
    const queryClient = new QueryClient();
    await queryClient.prefetchConnectQuery(
      queryDetails.schema,
      queryDetails.input,
      { transport: queryDetails.transport },
    );
    await queryClient.refetchConnectQueries(queryDetails);
    const queryState = queryClient.getConnectQueryState({
      ...queryDetails,
      cardinality: "finite",
    });
    expect(queryState.dataUpdateCount).toBe(2);
  });

  it("refetch all methods for a given service", async () => {
    const queryClient = new QueryClient();
    await queryClient.prefetchConnectQuery(
      queryDetails.schema,
      queryDetails.input,
      { transport: queryDetails.transport },
    );

    await queryClient.refetchConnectQueries({
      schema: ElizaService,
      transport: mockedElizaTransport,
    });
    const queryState = queryClient.getConnectQueryState({
      ...queryDetails,
      cardinality: "finite",
    });
    expect(queryState.dataUpdateCount).toBe(2);
  });
});

describe("setConnectQueryData", () => {
  it("updates locally fetched data", async () => {
    const queryClient = new QueryClient();
    await queryClient.prefetchConnectQuery(
      queryDetails.schema,
      queryDetails.input,
      { transport: queryDetails.transport },
    );

    const queryState = queryClient.getConnectQueryState({
      ...queryDetails,
      cardinality: "finite",
    });
    expect(queryState.dataUpdateCount).toBe(1);
    expect(queryState.data?.sentence).toBe("Hello Pablo");

    queryClient.setConnectQueryData(
      {
        ...queryDetails,
        cardinality: "finite",
      },
      {
        sentence: "Hello Stu",
      },
    );

    const newQueryState = queryClient.getConnectQueryState({
      ...queryDetails,
      cardinality: "finite",
    });

    expect(newQueryState.dataUpdateCount).toBe(2);
    expect(newQueryState.data?.sentence).toBe("Hello Stu");
  });

  it("updates locally fetched data with a callback", async () => {
    const queryClient = new QueryClient();
    await queryClient.prefetchConnectQuery(
      queryDetails.schema,
      queryDetails.input,
      { transport: queryDetails.transport },
    );

    const queryState = queryClient.getConnectQueryState({
      ...queryDetails,
      cardinality: "finite",
    });
    expect(queryState.dataUpdateCount).toBe(1);
    expect(queryState.data?.sentence).toBe("Hello Pablo");

    queryClient.setConnectQueryData(
      {
        ...queryDetails,
        cardinality: "finite",
      },
      (prev) => {
        if (prev === undefined) {
          return undefined;
        }
        expect(prev.sentence).toBe("Hello Pablo");
        return {
          ...prev,
          sentence: "Hello Stu",
        };
      },
    );

    const newQueryState = queryClient.getConnectQueryState({
      ...queryDetails,
      cardinality: "finite",
    });

    expect(newQueryState.dataUpdateCount).toBe(2);
    expect(newQueryState.data?.sentence).toBe("Hello Stu");
  });

  it("can update infinite paginated data", async () => {
    const queryClient = new QueryClient();
    await queryClient.prefetchConnectInfiniteQuery(
      ListService.method.list,
      {
        page: 0n,
      },
      {
        transport: paginatedTransport,
        getNextPageParam: (l) => l.page + 1n,
        pageParamKey: "page",
      },
    );

    const queryState = queryClient.getConnectQueryState({
      schema: ListService.method.list,
      transport: paginatedTransport,
      cardinality: "infinite",
      input: {
        page: 0n,
      },
    });
    expect(queryState.dataUpdateCount).toBe(1);
    expect(queryState.data?.pages).toHaveLength(1);

    queryClient.setConnectQueryData(
      {
        schema: ListService.method.list,
        transport: paginatedTransport,
        cardinality: "infinite",
      },
      {
        pageParams: [0n, 1n],
        pages: [
          {
            page: 0n,
            items: ["a", "b", "c"],
          },
          {
            page: 1n,
            items: ["x", "y", "z"],
          },
        ],
      },
    );

    const newQueryState = queryClient.getConnectQueryState({
      schema: ListService.method.list,
      transport: paginatedTransport,
      cardinality: "infinite",
      input: {
        page: 0n,
      },
    });

    expect(newQueryState.dataUpdateCount).toBe(2);
    expect(newQueryState.data?.pages).toHaveLength(2);
  });
});

describe("setConnectQueriesData", () => {
  it("update locally fetched data across multiple queries", async () => {
    const queryClient = new QueryClient();
    await queryClient.prefetchConnectQuery(
      queryDetails.schema,
      queryDetails.input,
      { transport: queryDetails.transport },
    );
    await queryClient.prefetchConnectQuery(
      queryDetails.schema,
      {
        sentence: "Stu",
      },
      { transport: queryDetails.transport },
    );

    const cachedItems = queryClient.getQueryCache().findAll({
      queryKey: createConnectQueryKey({
        ...queryDetails,
        input: {},
        cardinality: "finite",
      }),
    });
    expect(cachedItems).toHaveLength(2);

    queryClient.setConnectQueriesData(
      {
        schema: sayMethodDescriptor,
        cardinality: "finite",
      },
      (prev) => {
        if (prev === undefined) {
          return undefined;
        }
        return {
          ...prev,
          sentence: prev.sentence + "!",
        };
      },
    );

    const newCachedItems = queryClient.getQueryCache().findAll() as Query<
      MessageShape<typeof SayResponseSchema>
    >[];
    expect(newCachedItems).toHaveLength(2);
    expect(newCachedItems[0].state.data?.sentence).toBe("Hello Pablo!");
    expect(newCachedItems[1].state.data?.sentence).toBe("Hello Stu!");
  });
});

describe("fetchConnectInfiniteQuery", () => {
  it("fetches infinite data", async () => {
    const queryClient = new QueryClient();
    const result = await queryClient.fetchConnectInfiniteQuery(
      ListService.method.list,
      {
        preview: true,
        page: 0n,
      },
      {
        transport: paginatedTransport,
        getNextPageParam: (data) => {
          return data.page + 1n;
        },
        pageParamKey: "page",
      },
    );

    expect(result).toBeDefined();
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].$typeName).toBe("ListResponse");
    expect(result.pages[0].items).toHaveLength(3);
  });
});

describe("getConnectQueryState", () => {
  it("can get state for infinite queries", async () => {
    const queryClient = new QueryClient();
    await queryClient.fetchConnectInfiniteQuery(
      ListService.method.list,
      {
        preview: true,
        page: 0n,
      },
      {
        transport: paginatedTransport,
        getNextPageParam: (data) => {
          return data.page + 1n;
        },
        pageParamKey: "page",
      },
    );

    const state = queryClient.getConnectQueryState({
      schema: ListService.method.list,
      transport: paginatedTransport,
      input: {
        preview: true,
      },
      cardinality: "infinite",
    });

    expect(state.status).toBe("success");
    expect(state.fetchStatus).toBe("idle");
    expect(state.dataUpdateCount).toBe(1);
  });
});

describe("ensure APIs", () => {
  it("ensure data exists for infinite queries", async () => {
    const queryClient = new QueryClient();
    const data = await queryClient.ensureConnectInfiniteQueryData(
      ListService.method.list,
      {
        preview: true,
        page: 0n,
      },
      {
        transport: paginatedTransport,
        getNextPageParam: (localData) => {
          return localData.page + 1n;
        },
        pageParamKey: "page",
        staleTime: 1000,
      },
    );

    const state = queryClient.getConnectQueryState({
      schema: ListService.method.list,
      transport: paginatedTransport,
      input: {
        preview: true,
      },
      cardinality: "infinite",
    });
    expect(state.status).toBe("success");
    expect(state.fetchStatus).toBe("idle");
    expect(state.dataUpdateCount).toBe(1);
    expect(data.pages[0]).toBe(state.data?.pages[0]);
  });
});
