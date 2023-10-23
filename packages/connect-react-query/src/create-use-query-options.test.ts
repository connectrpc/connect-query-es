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
import { useQueries, useSuspenseQueries } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";

import {
  createUseQueryOptions,
  createUseSuspenseQueryOptions,
} from "./create-use-query-options";
import { defaultOptions } from "./default-options";
import { ElizaService, PaginatedService } from "./gen/eliza_connect";
import { mockEliza, mockPaginatedTransport, wrapper } from "./jest/test-utils";

const sayMethodDescriptor = {
  ...ElizaService.methods.say,
  localName: "Say",
  service: {
    typeName: ElizaService.typeName,
  },
};

const listMethodDescriptor = {
  ...PaginatedService.methods.list,
  localName: "List",
  service: {
    typeName: PaginatedService.typeName,
  },
};

describe("createUseQueryOptions", () => {
  it("can be used with useQueries", async () => {
    const { result } = renderHook(
      () => {
        const [query1, query2] = useQueries({
          queries: [
            createUseQueryOptions(
              sayMethodDescriptor,
              { sentence: "query 1" },
              {
                transport: mockEliza({
                  sentence: "Response 1",
                }),
              },
            ),
            createUseQueryOptions(
              listMethodDescriptor,
              { page: 0n },
              {
                transport: mockPaginatedTransport({
                  page: 0n,
                  items: ["1 item"],
                }),
              },
            ),
          ],
        });
        return {
          query1,
          query2,
        };
      },
      wrapper({
        defaultOptions,
      }),
    );

    await waitFor(() => {
      expect(result.current.query1.isSuccess).toBeTruthy();
      expect(result.current.query2.isSuccess).toBeTruthy();
    });
    expect(result.current.query1.data?.sentence).toEqual("Response 1");
    expect(result.current.query2.data?.items).toEqual(["1 item"]);
  });
});

describe("createUseSuspenseQueryOptions", () => {
  it("can be used with useSuspenseQueries", async () => {
    const { result } = renderHook(
      () => {
        const [query1, query2] = useSuspenseQueries({
          queries: [
            createUseSuspenseQueryOptions(
              sayMethodDescriptor,
              { sentence: "query 1" },
              {
                transport: mockEliza({
                  sentence: "Response 1",
                }),
              },
            ),
            createUseSuspenseQueryOptions(
              listMethodDescriptor,
              { page: 0n },
              {
                transport: mockPaginatedTransport({
                  page: 0n,
                  items: ["1 item"],
                }),
              },
            ),
          ],
        });
        return {
          query1,
          query2,
        };
      },
      wrapper({
        defaultOptions,
      }),
    );

    await waitFor(() => {
      expect(result.current.query1.isSuccess).toBeTruthy();
      expect(result.current.query2.isSuccess).toBeTruthy();
    });
    expect(result.current.query1.data.sentence).toEqual("Response 1");
    expect(result.current.query2.data.items).toEqual(["1 item"]);
  });
});
