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

import { createConnectQueryKey } from "./connect-query-key";
import { SayRequest } from "./gen/eliza_pb";
import { disableQuery } from "./utils";

describe("makeQueryKey", () => {
  const methodDescriptor = {
    I: SayRequest,
    name: "name",
    service: {
      typeName: "service.typeName",
    },
  };

  it("makes a query key with input", () => {
    const key = createConnectQueryKey(methodDescriptor, {
      sentence: "someValue",
    });
    expect(key).toStrictEqual([
      "service.typeName",
      "name",
      { sentence: "someValue" },
    ]);
  });

  it("allows empty inputs", () => {
    const key = createConnectQueryKey(methodDescriptor);
    expect(key).toStrictEqual(["service.typeName", "name", {}]);
  });

  it("makes a query key with a disabled input", () => {
    const key = createConnectQueryKey(methodDescriptor, disableQuery);
    expect(key).toStrictEqual(["service.typeName", "name", {}]);
  });
});
