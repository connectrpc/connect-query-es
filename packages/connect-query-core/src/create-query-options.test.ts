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

import { skipToken as tanstackSkipToken } from "@tanstack/query-core";
import { mockEliza } from "test-utils";
import { ElizaService } from "test-utils/gen/eliza_pb.js";
import { describe, expect, expectTypeOf, it } from "vitest";

import { createConnectQueryKey } from "./connect-query-key.js";
import { createQueryOptions } from "./create-query-options.js";
import { skipToken } from "./index.js";

// TODO: maybe create a helper to take a service and method and generate this.
const sayMethodDescriptor = ElizaService.method.say;

const mockedElizaTransport = mockEliza();

describe("createQueryOptions", () => {
  it("honors skipToken", () => {
    const opt = createQueryOptions(sayMethodDescriptor, skipToken, {
      transport: mockedElizaTransport,
    });
    expect(opt.queryFn).toBe(skipToken);
    expectTypeOf(opt.queryFn).toEqualTypeOf(skipToken);
  });

  it("honors skipToken directly from tanstack", () => {
    const opt = createQueryOptions(sayMethodDescriptor, tanstackSkipToken, {
      transport: mockedElizaTransport,
    });
    expect(opt.queryFn).toBe(tanstackSkipToken);
  });

  it("sets queryKey", () => {
    const want = createConnectQueryKey({
      schema: sayMethodDescriptor,
      input: { sentence: "hi" },
      transport: mockedElizaTransport,
      cardinality: "finite",
      headers: {
        "x-custom-header": "custom-value",
      },
    });
    const opt = createQueryOptions(
      sayMethodDescriptor,
      { sentence: "hi" },
      {
        transport: mockedElizaTransport,
        headers: {
          "x-custom-header": "custom-value",
        },
      },
    );
    expect(opt.queryKey).toStrictEqual(want);
  });

  it("ensures type safety of parameters", () => {
    // @ts-expect-error(2322) cannot provide invalid parameters
    createQueryOptions(
      sayMethodDescriptor,
      {
        sentence: 1,
      },
      {
        transport: mockedElizaTransport,
      },
    );
  });
});
