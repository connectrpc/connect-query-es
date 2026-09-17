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
import { Code, ConnectError, createRouterTransport } from "@connectrpc/connect";
import { skipToken } from "@connectrpc/connect-query-core";
import { renderHook, waitFor } from "@testing-library/react";
import { mockBigInt, mockEliza } from "test-utils";
import { BigIntService } from "test-utils/gen/bigint_pb.js";
import { ElizaService } from "test-utils/gen/eliza_pb.js";
import { describe, expect, expectTypeOf, it } from "vitest";

import { useQueries } from "./index.js";
import { wrapper } from "./test/test-wrapper.js";

const say = ElizaService.method.say;
const count = BigIntService.method.count;
const bigintTransport = mockBigInt();

describe("useQueries", () => {
  it("infers heterogeneous results and uses transport overrides", async () => {
    const { result } = renderHook(
      () =>
        useQueries({
          queries: [
            { schema: say, input: { sentence: "hello" } },
            { schema: count, input: { add: 2n }, transport: bigintTransport },
          ],
        }),
      wrapper({}, mockEliza({ sentence: "response" })),
    );
    expect(result.current.map((r) => r.data)).toEqual([undefined, undefined]);
    await waitFor(() =>
      expect(result.current.every((r) => r.isSuccess)).toBe(true),
    );
    expect(result.current[0].data?.sentence).toBe("response");
    expect(result.current[1].data?.count).toBe(1n);
    expectTypeOf(result.current[0].data).toEqualTypeOf<
      MessageShape<typeof say.output> | undefined
    >();
    expectTypeOf(result.current[1].data).toEqualTypeOf<
      MessageShape<typeof count.output> | undefined
    >();
    expectTypeOf(result.current[0].error).toEqualTypeOf<ConnectError | null>();
  });

  it("infers select and combine results", async () => {
    const { result } = renderHook(
      () =>
        useQueries({
          queries: [
            { schema: say, select: (data) => data.sentence.length },
            { schema: say, input: { sentence: "other" } },
          ],
          combine: (results) => {
            expectTypeOf(results[0].data).toEqualTypeOf<number | undefined>();
            expectTypeOf(results[1].data).toEqualTypeOf<
              MessageShape<typeof say.output> | undefined
            >();
            return {
              length: results[0].data,
              sentence: results[1].data?.sentence,
            };
          },
        }),
      wrapper({}, mockEliza({ sentence: "response" })),
    );
    expect(result.current).toEqual({ length: undefined, sentence: undefined });
    await waitFor(() =>
      expect(result.current).toEqual({ length: 8, sentence: "response" }),
    );
    expectTypeOf(result.current).toEqualTypeOf<{
      length: number | undefined;
      sentence: string | undefined;
    }>();
  });

  it("supports disabled and skipped queries and can enable them later", async () => {
    const requests: string[] = [];
    const transport = createRouterTransport(({ service }) =>
      service(ElizaService, {
        say: (request) => {
          requests.push(request.sentence);
          return { sentence: request.sentence };
        },
      }),
    );
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useQueries({
          queries: [
            { schema: say, input: { sentence: "disabled" }, enabled },
            {
              schema: say,
              input: enabled ? { sentence: "skipped" } : skipToken,
            },
            { schema: say, input: { sentence: "active" } },
          ],
        }),
      { ...wrapper({}, transport), initialProps: { enabled: false } },
    );
    await waitFor(() => expect(result.current[2].isSuccess).toBe(true));
    expect(requests).toEqual(["active"]);
    expect(
      result.current.slice(0, 2).map((r) => [r.status, r.fetchStatus, r.data]),
    ).toEqual([
      ["pending", "idle", undefined],
      ["pending", "idle", undefined],
    ]);
    rerender({ enabled: true });
    await waitFor(() =>
      expect(result.current.map((r) => r.data?.sentence)).toEqual([
        "disabled",
        "skipped",
        "active",
      ]),
    );
  });

  it("supports placeholder and initial data", () => {
    const initial = create(say.output, { sentence: "initial" });
    const placeholder = create(say.output, { sentence: "placeholder" });
    const { result } = renderHook(
      () =>
        useQueries({
          queries: [
            {
              schema: say,
              input: { sentence: "one" },
              enabled: false,
              placeholderData: () => placeholder,
            },
            {
              schema: say,
              input: { sentence: "two" },
              enabled: false,
              initialData: initial,
            },
          ],
        }),
      wrapper(),
    );
    expect(result.current[0].data).toEqual(placeholder);
    expect(result.current[0].isPlaceholderData).toBe(true);
    expect(result.current[1].data).toEqual(initial);
    expect(result.current[1].isPlaceholderData).toBe(false);
  });

  it("starts requests in parallel and forwards headers", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const requests: string[] = [];
    const transport = createRouterTransport(({ service }) =>
      service(ElizaService, {
        say: async (request, context) => {
          requests.push(
            `${request.sentence}:${context.requestHeader.get("x-test")}`,
          );
          await gate;
          return { sentence: request.sentence };
        },
      }),
    );
    const { result } = renderHook(
      () =>
        useQueries({
          queries: [
            {
              schema: say,
              input: { sentence: "first" },
              headers: { "x-test": "one" },
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
      expect(result.current.map((r) => r.isPending)).toEqual([true, true]);
    } finally {
      release();
    }
    await waitFor(() =>
      expect(result.current.map((r) => r.data?.sentence)).toEqual([
        "first",
        "second",
      ]),
    );
  });

  it("returns errors independently of successful queries", async () => {
    const transport = createRouterTransport(({ service }) =>
      service(ElizaService, {
        say: (request) => {
          if (request.sentence === "fail")
            throw new ConnectError("failure", Code.InvalidArgument);
          return { sentence: request.sentence };
        },
      }),
    );
    const { result } = renderHook(
      () =>
        useQueries({
          queries: [
            { schema: say, input: { sentence: "fail" }, retry: false },
            { schema: say, input: { sentence: "success" } },
          ],
        }),
      wrapper({}, transport),
    );
    await waitFor(() =>
      expect(result.current.map((r) => r.status)).toEqual(["error", "success"]),
    );
    expect(result.current[0].error?.code).toBe(Code.InvalidArgument);
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[1].data?.sentence).toBe("success");
  });

  it("supports empty, dynamic, and readonly arrays", async () => {
    const empty = renderHook(() => useQueries({ queries: [] }), wrapper());
    expect(empty.result.current).toEqual([]);
    expectTypeOf(empty.result.current).toEqualTypeOf<[]>();
    const queries = ["first", "second"].map((sentence) => ({
      schema: say,
      input: { sentence },
    }));
    const { result } = renderHook(
      () => useQueries({ queries }),
      wrapper({}, mockEliza({ sentence: "response" })),
    );
    await waitFor(() =>
      expect(result.current.every((r) => r.isSuccess)).toBe(true),
    );
    expectTypeOf<(typeof result.current)[number]["data"]>().toEqualTypeOf<
      MessageShape<typeof say.output> | undefined
    >();
    const readonlyQueries = [{ schema: say }] as const;
    const other = renderHook(
      () => useQueries({ queries: readonlyQueries }),
      wrapper({}, mockEliza({ sentence: "response" })),
    );
    await waitFor(() =>
      expect(other.result.current[0].data?.sentence).toBe("response"),
    );
    expectTypeOf(other.result.current[0].data).toEqualTypeOf<
      MessageShape<typeof say.output> | undefined
    >();
  });

  it("rejects invalid inputs and query overrides", () => {
    const useInvalidQueries = () => {
      // @ts-expect-error Input must match the method.
      useQueries({ queries: [{ schema: say, input: { add: 2n } }] });
      // @ts-expect-error Keys are generated from the RPC.
      useQueries({ queries: [{ schema: say, queryKey: ["custom"] }] });
      useQueries({
        queries: [
          {
            schema: say,
            // @ts-expect-error useQueries cannot supply previous data.
            placeholderData: (previous: MessageShape<typeof say.output>) =>
              previous,
          },
        ],
      });
    };
    expectTypeOf(useInvalidQueries).toBeFunction();
  });
});
