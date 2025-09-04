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
import type { ConnectQueryKey } from "@connectrpc/connect-query-core";
import {
  callUnaryMethod,
  createConnectQueryKey,
} from "@connectrpc/connect-query-core";
import type { QueryFunctionContext } from "@tanstack/react-query";
import { useQueries } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { mockEliza } from "test-utils";
import type { SayRequest } from "test-utils/gen/eliza_pb.js";
import { ElizaService, SayRequestSchema } from "test-utils/gen/eliza_pb.js";
import { describe, expect, it } from "vitest";

import { wrapper } from "./test/test-wrapper.js";

describe("callUnaryMethod", () => {
  it("can be used with useQueries", async () => {
    const transport = mockEliza({
      sentence: "Response 1",
    });
    const { result } = renderHook(() => {
      const input: SayRequest = create(SayRequestSchema, {
        sentence: "query 1",
      });
      const [query1] = useQueries({
        queries: [
          {
            queryKey: createConnectQueryKey({
              schema: ElizaService.method.say,
              input,
              transport,
              cardinality: "finite",
            }),
            queryFn: async ({
              signal,
            }: QueryFunctionContext<ConnectQueryKey>) => {
              const res = await callUnaryMethod(
                transport,
                ElizaService.method.say,
                input,
                {
                  signal,
                },
              );
              return res;
            },
          },
        ],
      });
      return {
        query1,
      };
    }, wrapper());

    await waitFor(() => {
      expect(result.current.query1.isSuccess).toBeTruthy();
    });
    expect(result.current.query1.data?.sentence).toEqual("Response 1");
  });
  it("can pass headers through", async () => {
    let resolve: () => void;
    const promise = new Promise<void>((res) => {
      resolve = res;
    });
    const transport = mockEliza({
      sentence: "Response 1",
    }, false, {
      router: {
        interceptors: [(next) => (req) => {
          expect(req.header.get("x-custom-header")).toEqual("custom-value");
          resolve();
          return next(req);
        }]
      }
    });
    const input: SayRequest = create(SayRequestSchema, {
      sentence: "query 1",
    });
    const res = await callUnaryMethod(
      transport,
      ElizaService.method.say,
      input,
      {
        headers: {
          "x-custom-header": "custom-value",
        },
      },
    );
    await promise;
    expect(res.sentence).toEqual("Response 1");
  });
});
