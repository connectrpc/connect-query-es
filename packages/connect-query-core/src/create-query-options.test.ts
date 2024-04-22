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

import { createQueryOptions } from "./create-query-options.js";
import { ElizaService } from "./gen/eliza_connect.js";
import { mockEliza } from "./jest/test-utils.js";
import { disableQuery } from "./utils.js";

const methodDescriptor = {
  ...ElizaService.methods.say,
  service: {
    typeName: ElizaService.typeName,
  },
};

describe("createQueryOptions", () => {
  it("calls a unary method", async () => {
    const options = createQueryOptions(
      methodDescriptor,
      {
        sentence: "name",
      },
      {
        transport: mockEliza(),
      },
    );
    expect(options.enabled).toBeTruthy();
    const result = await options.queryFn({
      queryKey: options.queryKey,
      meta: {},
      signal: new AbortController().signal,
    });
    expect(result.sentence).toEqual("Hello name");
  });

  it("can be disabled", () => {
    const options = createQueryOptions(methodDescriptor, disableQuery, {
      transport: mockEliza(),
    });
    expect(options.enabled).toBeFalsy();
  });
});
