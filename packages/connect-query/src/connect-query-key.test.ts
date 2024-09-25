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
import { describe, expect, it } from "@jest/globals";

import { createConnectQueryKey } from "./connect-query-key.js";
import { ElizaService, SayRequestSchema } from "./gen/eliza_pb.js";
import { disableQuery } from "./utils.js";

describe("makeQueryKey", () => {
  const methodDescriptor = {
    input: SayRequestSchema,
    name: "name",
    parent: ElizaService,
  };

  it("makes a query key with input", () => {
    const key = createConnectQueryKey(methodDescriptor, {
      sentence: "someValue",
    });
    expect(key).toStrictEqual([
      ElizaService.typeName,
      "name",
      create(SayRequestSchema, { sentence: "someValue" }),
    ]);
  });

  it("allows empty inputs", () => {
    const key = createConnectQueryKey(methodDescriptor);
    expect(key).toStrictEqual([
      ElizaService.typeName,
      "name",
      create(methodDescriptor.input),
    ]);
  });

  it("makes a query key with a disabled input", () => {
    const key = createConnectQueryKey(methodDescriptor, disableQuery);
    expect(key).toStrictEqual([
      ElizaService.typeName,
      "name",
      create(methodDescriptor.input),
    ]);
  });

  it("generates identical keys when input is empty or the default is explicitly sent", () => {
    const key1 = createConnectQueryKey(methodDescriptor, {});
    const key2 = createConnectQueryKey(methodDescriptor, { sentence: "" });
    expect(key1).toStrictEqual(key2);
  });

  // describe("new", () => {
  //   it.only("test new", () => {
  //     const key = createConnectQueryKey2(methodDescriptor as unknown as any, {
  //       sentence: "hello world",
  //     });

  //     console.log("keyss", key);
  //   });
  // });
});
