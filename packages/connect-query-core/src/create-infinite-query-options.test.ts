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

import { mockEliza } from "test-utils";
import { ListService } from "test-utils/gen/list_pb.js";
import { describe, expect, expectTypeOf, it } from "vitest";

import { createInfiniteQueryOptions, skipToken } from "./index.js";

const listMethod = ListService.method.list;

const mockedElizaTransport = mockEliza();

describe("createInfiniteQueryOptions", () => {
  it("honors skipToken", () => {
    const opt = createInfiniteQueryOptions(listMethod, skipToken, {
      transport: mockedElizaTransport,
      getNextPageParam: (lastPage) => lastPage.page + 1n,
      pageParamKey: "page",
    });
    expect(opt.queryFn).toBe(skipToken);
    expectTypeOf(opt.queryFn).toEqualTypeOf(skipToken);
  });
});
