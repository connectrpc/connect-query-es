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

import { createInfiniteQueryOptions } from "./create-infinite-query-options.js";
import { PaginatedService } from "./gen/eliza_connect.js";
import { ListResponse } from "./gen/eliza_pb.js";
import { mockPaginatedTransport } from "./jest/test-utils.js";
import { disableQuery } from "./utils.js";

const methodDescriptor = {
  ...PaginatedService.methods.list,
  service: {
    typeName: PaginatedService.typeName,
  },
};

describe("createInfiniteQueryOptions", () => {
  it("calls a unary method", async () => {
    const options = createInfiniteQueryOptions(
      methodDescriptor,
      {
        page: 0n,
      },
      {
        getNextPageParam: (lastPage) => lastPage.page + 1n,
        pageParamKey: "page",
        transport: mockPaginatedTransport(),
      },
    );
    expect(options.initialPageParam).toEqual(0n);
    expect(options.enabled).toBeTruthy();

    const result = await options.queryFn({
      queryKey: options.queryKey,
      direction: "forward",
      meta: {},
      pageParam: 0n,
      signal: new AbortController().signal,
    });

    expect(result.items).toHaveLength(3);

    expect(
      options.getNextPageParam(
        new ListResponse({
          items: [],
          page: 2n,
        }),
        [],
        undefined,
        [],
      ),
    ).toEqual(3n);
  });

  it("can be disabled", () => {
    const options = createInfiniteQueryOptions(methodDescriptor, disableQuery, {
      getNextPageParam: (lastPage) => lastPage.page + 1n,
      pageParamKey: "page",
      transport: mockPaginatedTransport(),
    });
    expect(options.enabled).toBeFalsy();
  });
});
