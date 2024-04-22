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

import { callUnaryMethod } from "./call-unary-method.js";
import { ElizaService } from "./gen/eliza_connect.js";
import { mockEliza } from "./jest/test-utils.js";

describe("callUnaryMethod", () => {
  it("calls a unary method", async () => {
    const transport = mockEliza();
    const result = await callUnaryMethod(
      {
        ...ElizaService.methods.say,
        service: {
          typeName: ElizaService.typeName,
        },
      },
      {
        sentence: "name",
      },
      {
        transport,
      },
    );
    expect(result.sentence).toEqual("Hello name");
  });

  it("undefined message provides a default", async () => {
    const transport = mockEliza();
    const result = await callUnaryMethod(
      {
        ...ElizaService.methods.say,
        service: {
          typeName: ElizaService.typeName,
        },
      },
      undefined,
      {
        transport,
      },
    );
    expect(result.sentence).toEqual("Hello ");
  });
});
