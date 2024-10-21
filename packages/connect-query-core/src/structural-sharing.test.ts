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
import { describe, expect, it } from "vitest";

import { SayRequestSchema, SayResponseSchema } from "./gen/eliza_pb.js";
import { createStructuralSharing } from "./structural-sharing.js";

describe("structural sharing", () => {
  const schema = SayResponseSchema;
  const fn = createStructuralSharing(schema);
  it("returns old data if new data is equal", () => {
    const oldData = create(schema, { sentence: "hi" });
    const newData = create(schema, { sentence: "hi" });
    const result = fn(oldData, newData);
    expect(result).toStrictEqual(oldData);
  });
  it("returns new data if not equal to old data", () => {
    const oldData = create(schema, { sentence: "hi" });
    const newData = create(schema, { sentence: "hello" });
    const result = fn(oldData, newData);
    expect(result).toStrictEqual(newData);
  });
  it("returns new data if old data is undefined", () => {
    const oldData = undefined;
    const newData = create(schema, { sentence: "hello" });
    const result = fn(oldData, newData);
    expect(result).toStrictEqual(newData);
  });
  it.each([123, null, create(SayRequestSchema, { sentence: "hi" })])(
    "returns new data for unexpected old data $#",
    (oldData) => {
      const newData = create(schema, { sentence: "hi" });
      const result = fn(oldData, newData);
      expect(result).toStrictEqual(newData);
    },
  );
  it.each([123, null, create(SayRequestSchema, { sentence: "hi" })])(
    "returns new data for unexpected new data $#",
    (newData) => {
      const oldData = create(schema, { sentence: "hi" });
      const result = fn(oldData, newData);
      expect(result).toStrictEqual(newData);
    },
  );
});
