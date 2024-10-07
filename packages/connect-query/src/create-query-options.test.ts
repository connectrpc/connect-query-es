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

import { skipToken } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { createConnectQueryKey } from "./connect-query-key.js";
import { createQueryOptions } from "./create-query-options.js";
import { ElizaService } from "./gen/eliza_pb.js";
import { mockEliza } from "./test/test-utils.js";

// TODO: maybe create a helper to take a service and method and generate this.
const sayMethodDescriptor = ElizaService.method.say;

const mockedElizaTransport = mockEliza();

describe("createQueryOptions", () => {
  it("honors skipToken", () => {
    const opt = createQueryOptions(sayMethodDescriptor, skipToken, {
      transport: mockedElizaTransport,
    });
    expect(opt.queryFn).toBe(skipToken);
  });
  it("sets queryKey", () => {
    const want = createConnectQueryKey({
      method: sayMethodDescriptor,
      input: { sentence: "hi" },
      transport: mockedElizaTransport,
    });
    const opt = createQueryOptions(
      sayMethodDescriptor,
      { sentence: "hi" },
      {
        transport: mockedElizaTransport,
      },
    );
    expect(opt.queryKey).toStrictEqual(want);
  });
});
