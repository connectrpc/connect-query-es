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
import type { MessageShape } from "@bufbuild/protobuf";
import { createRouterTransport } from "@connectrpc/connect";
import { skipToken } from "@connectrpc/connect-query-core";
import { renderHook, waitFor } from "@testing-library/react";
import { mockBigInt, mockEliza } from "test-utils";
import { BigIntService } from "test-utils/gen/bigint_pb.js";
import { ElizaService } from "test-utils/gen/eliza_pb.js";
import { describe, expect, expectTypeOf, it } from "vitest";

import { useSuspenseQueries } from "./index.js";
import { wrapper } from "./test/test-wrapper.js";

const say = ElizaService.method.say;
const count = BigIntService.method.count;
const bigintTransport = mockBigInt();

describe("useSuspenseQueries", () => {
  it("infers heterogeneous responses and uses per-query transports", async () => {
    const { result } = renderHook(
      () =>
        useSuspenseQueries({
          queries: [
            { schema: say, input: { sentence: "hello" } },
            { schema: count, input: { add: 2n }, transport: bigintTransport },
          ],
        }),
      wrapper({}, mockEliza({ sentence: "response" })),
    );
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current[0].data.sentence).toBe("response");
    expect(result.current[1].data.count).toBe(1n);
    expectTypeOf(result.current[0].data).toEqualTypeOf<
      MessageShape<typeof say.output>
    >();
    expectTypeOf(result.current[1].data).toEqualTypeOf<
      MessageShape<typeof count.output>
    >();
  });

  it("infers select and combine results", async () => {
    const { result } = renderHook(
      () =>
        useSuspenseQueries({
          queries: [
            { schema: say, select: (data) => data.sentence.length },
            { schema: say, input: { sentence: "other" } },
          ],
          combine: (results) => {
            expectTypeOf(results[0].data).toEqualTypeOf<number>();
            expectTypeOf(results[1].data).toEqualTypeOf<
              MessageShape<typeof say.output>
            >();
            return {
              length: results[0].data,
              sentence: results[1].data.sentence,
            };
          },
        }),
      wrapper({}, mockEliza({ sentence: "response" })),
    );
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toEqual({ length: 8, sentence: "response" });
    expectTypeOf(result.current).toEqualTypeOf<{
      length: number;
      sentence: string;
    }>();
  });

  it("supports empty queries", () => {
    const { result } = renderHook(
      () => useSuspenseQueries({ queries: [] }),
      wrapper(),
    );
    expect(result.current).toEqual([]);
    expectTypeOf(result.current).toEqualTypeOf<[]>();
  });

  it("starts every request before waiting and forwards headers", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const requests: string[] = [];
    const transport = createRouterTransport(({ service }) => {
      service(ElizaService, {
        say: async (request, context) => {
          requests.push(
            `${request.sentence}:${context.requestHeader.get("x-test")}`,
          );
          await gate;
          return { sentence: request.sentence };
        },
      });
    });
    const { result } = renderHook(
      () =>
        useSuspenseQueries({
          queries: [
            {
              schema: say,
              input: { sentence: "first" },
              headers: { "x-test": "one" },
              staleTime: Infinity,
            },
            {
              schema: say,
              input: { sentence: "second" },
              headers: { "x-test": "two" },
            },
          ],
        }),
      wrapper({}, transport),
    );
    try {
      await waitFor(() =>
        expect(requests).toEqual(["first:one", "second:two"]),
      );
      expect(result.current).toBeNull();
    } finally {
      release();
    }
    await waitFor(() =>
      expect(result.current.map((r) => r.data.sentence)).toEqual([
        "first",
        "second",
      ]),
    );
  });

  it("supports dynamic and readonly query arrays", async () => {
    const queries = ["first", "second"].map((sentence) => ({
      schema: say,
      input: { sentence },
    }));
    const { result } = renderHook(
      () => useSuspenseQueries({ queries }),
      wrapper({}, mockEliza({ sentence: "response" })),
    );
    await waitFor(() => expect(result.current).toHaveLength(2));
    expectTypeOf<(typeof result.current)[number]["data"]>().toEqualTypeOf<
      MessageShape<typeof say.output>
    >();
    const readonlyQueries = [{ schema: say }] as const;
    const other = renderHook(
      () => useSuspenseQueries({ queries: readonlyQueries }),
      wrapper({}, mockEliza({ sentence: "response" })),
    );
    await waitFor(() =>
      expect(other.result.current[0].data.sentence).toBe("response"),
    );
    expectTypeOf(other.result.current[0].data).toEqualTypeOf<
      MessageShape<typeof say.output>
    >();
  });

  it("rejects invalid inputs and non-suspense options", () => {
    const useInvalidQueries = () => {
      // @ts-expect-error Input must match the method.
      useSuspenseQueries({ queries: [{ schema: say, input: { add: 2n } }] });
      // @ts-expect-error Suspense queries cannot be skipped.
      useSuspenseQueries({ queries: [{ schema: say, input: skipToken }] });
      // @ts-expect-error Suspense queries cannot be disabled.
      useSuspenseQueries({ queries: [{ schema: say, enabled: false }] });
      useSuspenseQueries({
        // @ts-expect-error Suspense queries cannot use placeholder data.
        queries: [{ schema: say, placeholderData: create(say.output) }],
      });
    };
    expectTypeOf(useInvalidQueries).toBeFunction();
  });
});
