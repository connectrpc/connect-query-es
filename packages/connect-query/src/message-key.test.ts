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

import { Proto2MessageSchema } from "./gen/proto2_pb.js";
import { Proto3Enum, Proto3MessageSchema } from "./gen/proto3_pb.js";
import { createMessageKey } from "./message-key.js";

describe("message key", () => {
  it("omits proto3 default values", () => {
    const schema = Proto3MessageSchema;
    const message = create(schema);
    const key = createMessageKey(schema, message);
    expect(key).toStrictEqual({});
  });
  it("omits proto2 default values", () => {
    const schema = Proto2MessageSchema;
    const message = create(schema);
    const key = createMessageKey(schema, message);
    expect(key).toStrictEqual({});
  });
  it("converts as expected", () => {
    const key = createMessageKey(Proto3MessageSchema, {
      int64Field: 123n,
      bytesField: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
      doubleField: Number.NaN,
      messageField: {
        doubleField: Infinity,
        messageField: {
          doubleField: -Infinity,
        },
      },
      boolField: true,
      enumField: Proto3Enum.YES,
      repeatedStringField: ["a", "b"],
      repeatedMessageField: [{ int64Field: 456n }],
      repeatedEnumField: [Proto3Enum.YES, Proto3Enum.NO],
      either: {
        case: "oneofInt32Field",
        value: 123,
      },
      mapStringInt64Field: {
        foo: 123n,
      },
      mapStringMessageField: {
        foo: {
          int64Field: 123n,
        },
      },
      mapStringEnumField: {
        foo: Proto3Enum.YES,
      },
    });
    expect(key).toStrictEqual({
      int64Field: "123",
      bytesField: "3q2+7w",
      doubleField: "NaN",
      messageField: {
        doubleField: "Infinity",
        messageField: {
          doubleField: "-Infinity",
        },
      },
      boolField: true,
      enumField: 1,
      repeatedStringField: ["a", "b"],
      repeatedMessageField: [{ int64Field: "456" }],
      repeatedEnumField: [1, 2],
      oneofInt32Field: 123,
      mapStringInt64Field: {
        foo: "123",
      },
      mapStringMessageField: {
        foo: {
          int64Field: "123",
        },
      },
      mapStringEnumField: {
        foo: 1,
      },
    });
  });
  it("sorts map keys", () => {
    const key = createMessageKey(Proto3MessageSchema, {
      mapStringInt64Field: {
        b: 2n,
        a: 1n,
      },
    });
    const mapKeys =
      typeof key.mapStringInt64Field == "object" &&
      key.mapStringInt64Field !== null
        ? Object.keys(key.mapStringInt64Field)
        : [];
    expect(mapKeys).toStrictEqual(["a", "b"]);
  });
  it("sorts properties by protobuf source order", () => {
    const key = createMessageKey(Proto3MessageSchema, {
      boolField: true,
      stringField: "a",
    });
    expect(Object.keys(key)).toStrictEqual(["stringField", "boolField"]);
  });
});
