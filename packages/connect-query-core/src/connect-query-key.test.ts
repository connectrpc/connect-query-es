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
import { ElizaService, SayRequestSchema } from "test-utils/gen/eliza_pb.js";
import { ListRequestSchema, ListService } from "test-utils/gen/list_pb.js";
import { describe, expect, it } from "vitest";

import { createConnectQueryKey } from "./connect-query-key.js";
import { skipToken } from "./index.js";
import { createMessageKey } from "./message-key.js";
import { createTransportKey } from "./transport-key.js";

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
});
