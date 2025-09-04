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
import type { Transport } from "@connectrpc/connect";
import {
  ElizaService,
  SayRequestSchema,
  SayResponseSchema,
  type SayResponse,
} from "test-utils/gen/eliza_pb.js";
import { ListRequestSchema, ListService } from "test-utils/gen/list_pb.js";
import { describe, expect, expectTypeOf, it } from "vitest";

import { createConnectQueryKey } from "./connect-query-key.js";
import { skipToken } from "./index.js";
import { createMessageKey } from "./message-key.js";
import { createTransportKey } from "./transport-key.js";
import { type InfiniteData, QueryClient } from "@tanstack/query-core";

describe("createConnectQueryKey", () => {
  const fakeTransport: Transport = {
    async stream() {
      return Promise.reject(new Error("unexpected"));
    },
    async unary() {
      return Promise.reject(new Error("unexpected"));
    },
  };

  it("creates a full key", () => {
    const key = createConnectQueryKey({
      transport: fakeTransport,
      schema: ElizaService.method.say,
      input: create(SayRequestSchema, { sentence: "hi" }),
      cardinality: "finite",
    });
    expect(key).toStrictEqual([
      "connect-query",
      {
        transport: createTransportKey(fakeTransport),
        serviceName: "connectrpc.eliza.v1.ElizaService",
        methodName: "Say",
        cardinality: "finite",
        input: createMessageKey(SayRequestSchema, { sentence: "hi" }),
      },
    ]);
  });

  it("creates a full infinite key", () => {
    const key = createConnectQueryKey({
      transport: fakeTransport,
      schema: ListService.method.list,
      input: create(ListRequestSchema, { page: 0n }),
      pageParamKey: "page",
      cardinality: "infinite",
    });
    expect(key).toStrictEqual([
      "connect-query",
      {
        transport: createTransportKey(fakeTransport),
        serviceName: "ListService",
        methodName: "List",
        cardinality: "infinite",
        input: createMessageKey(ListRequestSchema, {}),
      },
    ]);
  });

  it("allows input: undefined", () => {
    const key = createConnectQueryKey({
      schema: ElizaService.method.say,
      input: undefined,
      cardinality: "finite",
    });
    expect(key[1].input).toBeUndefined();
  });

  it("allows to omit input", () => {
    const key = createConnectQueryKey({
      schema: ElizaService.method.say,
      cardinality: "finite",
    });
    expect(key[1].input).toBeUndefined();
  });

  it("allows input: skipToken", () => {
    const key = createConnectQueryKey({
      schema: ElizaService.method.say,
      input: skipToken,
      cardinality: "finite",
    });
    expect(key[1].input).toBe("skipped");
  });

  it("allows to set cardinality: finite", () => {
    const key = createConnectQueryKey({
      schema: ElizaService.method.say,
      cardinality: "finite",
    });
    expect(key[1].cardinality).toBe("finite");
  });

  it("allows to set cardinality: undefined", () => {
    const key = createConnectQueryKey({
      schema: ElizaService.method.say,
      cardinality: undefined,
    });
    expect(key[1].cardinality).toBeUndefined();
  });

  it("allows to set a service schema", () => {
    const key = createConnectQueryKey({
      schema: ElizaService,
      cardinality: "finite",
    });
    expect(key[1].serviceName).toBe(ElizaService.typeName);
    expect(key[1].methodName).toBeUndefined();
  });

  it("cannot except invalid input", () => {
    createConnectQueryKey({
      // @ts-expect-error(2322) cannot create a key with invalid input
      schema: ElizaService.method.say,
      input: {
        sentence: 1,
      },
      cardinality: undefined,
    });
  });

  it("contains type hints to indicate the output type", () => {
    const sampleQueryClient = new QueryClient();
    const key = createConnectQueryKey({
      schema: ElizaService.method.say,
      input: create(SayRequestSchema, { sentence: "hi" }),
      cardinality: "finite",
    });
    const data = sampleQueryClient.getQueryData(key);

    expectTypeOf(data).toEqualTypeOf<SayResponse | undefined>();
  });

  it("supports typesafe data updaters", () => {
    const sampleQueryClient = new QueryClient();
    const key = createConnectQueryKey({
      schema: ElizaService.method.say,
      input: create(SayRequestSchema, { sentence: "hi" }),
      cardinality: "finite",
    });
    // @ts-expect-error(2345) this is a test to check if the type is correct
    sampleQueryClient.setQueryData(key, { sentence: 1 });
    // @ts-expect-error(2345) $typename is required
    sampleQueryClient.setQueryData(key, {
      sentence: "a proper value but missing $typename",
    });
    sampleQueryClient.setQueryData(
      key,
      create(SayResponseSchema, { sentence: "a proper value" }),
    );

    sampleQueryClient.setQueryData(key, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<SayResponse | undefined>();
      return create(SayResponseSchema, {
        sentence: "a proper value",
      });
    });
  });

  describe("headers", () => {
    it("allows headers to be passed as an object", () => {
      const key = createConnectQueryKey({
        schema: ElizaService.method.say,
        input: create(SayRequestSchema, { sentence: "hi" }),
        cardinality: "finite",
        headers: {
          "x-custom-header": "custom-value",
        },
      });
      expect(key[1].headers).toEqual({
        "x-custom-header": "custom-value",
      });
    });
    it("allows headers to be passed as a tuple", () => {
      const key = createConnectQueryKey({
        schema: ElizaService.method.say,
        input: create(SayRequestSchema, { sentence: "hi" }),
        cardinality: "finite",
        headers: [["x-custom-header", "custom-value"]],
      });
      expect(key[1].headers).toEqual({
        "x-custom-header": "custom-value",
      });
    });
    it("allows headers to be passed as a HeadersInit", () => {
      const key = createConnectQueryKey({
        schema: ElizaService.method.say,
        input: create(SayRequestSchema, { sentence: "hi" }),
        cardinality: "finite",
        headers: new Headers({
          "x-custom-header": "custom-value",
        }),
      });
      expect(key[1].headers).toEqual({
        "x-custom-header": "custom-value",
      });
    });
  });

  describe("infinite queries", () => {
    it("contains type hints to indicate the output type", () => {
      const sampleQueryClient = new QueryClient();
      const key = createConnectQueryKey({
        schema: ElizaService.method.say,
        input: create(SayRequestSchema, { sentence: "hi" }),
        cardinality: "infinite",
      });
      const data = sampleQueryClient.getQueryData(key);

      expectTypeOf(data).toEqualTypeOf<InfiniteData<SayResponse> | undefined>();
    });

    it("supports typesafe data updaters", () => {
      const sampleQueryClient = new QueryClient();
      const key = createConnectQueryKey({
        schema: ElizaService.method.say,
        input: create(SayRequestSchema, { sentence: "hi" }),
        cardinality: "infinite",
      });
      sampleQueryClient.setQueryData(key, {
        pages: [
          // @ts-expect-error(2345) make sure the shape is as expected
          { sentence: 1 },
        ],
      });
      sampleQueryClient.setQueryData(key, {
        // @ts-expect-error(2345) $typename is required
        pages: [{ sentence: "a proper value but missing $typename" }],
      });
      sampleQueryClient.setQueryData(key, {
        pageParams: [0],
        pages: [create(SayResponseSchema, { sentence: "a proper value" })],
      });
      sampleQueryClient.setQueryData(key, (prev) => {
        expectTypeOf(prev).toEqualTypeOf<
          InfiniteData<SayResponse> | undefined
        >();
        return {
          pageParams: [0],
          pages: [create(SayResponseSchema, { sentence: "a proper value" })],
        };
      });
    });
  });
});
