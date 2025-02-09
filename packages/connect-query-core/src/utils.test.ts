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

import { create, isFieldSet, isMessage } from "@bufbuild/protobuf";
import { Proto2MessageSchema } from "test-utils/gen/proto2_pb.js";
import { describe, expect, it } from "vitest";

import {
  assert,
  createProtobufSafeInfiniteUpdater,
  createProtobufSafeUpdater,
  isAbortController,
} from "./utils.js";

describe("assert", () => {
  const message = "assertion message";
  it("throws on a false condition", () => {
    expect(() => {
      assert(false, message);
    }).toThrow(`Invalid assertion: ${message}`);
  });

  it("does not throw on a true condition", () => {
    expect(() => {
      assert(true, message);
    }).not.toThrow();
  });
});

describe("isAbortController", () => {
  it("returns false for non-objects", () => {
    expect(isAbortController(true)).toBeFalsy();
    expect(isAbortController(false)).toBeFalsy();
    expect(isAbortController(0)).toBeFalsy();
    expect(isAbortController(1)).toBeFalsy();
    expect(isAbortController("a")).toBeFalsy();
    expect(isAbortController(undefined)).toBeFalsy();
    expect(isAbortController([])).toBeFalsy();
    expect(isAbortController(null)).toBeFalsy();
  });

  it("returns false for objects missing the AbortController properties", () => {
    expect(isAbortController({})).toBeFalsy();
    expect(isAbortController({ signal: undefined })).toBeFalsy();
    expect(isAbortController({ signal: null })).toBeFalsy();
    expect(isAbortController({ signal: {} })).toBeFalsy();
    expect(isAbortController({ signal: { aborted: undefined } })).toBeFalsy();
    expect(isAbortController({ signal: { aborted: true } })).toBeFalsy();
    expect(
      isAbortController({ signal: { aborted: true }, abort: undefined })
    ).toBeFalsy();
  });

  it("returns true for the two necessary AbortController properties", () => {
    expect(
      isAbortController({
        signal: {
          aborted: false,
        },
        abort: () => {},
      })
    ).toBeTruthy();

    expect(isAbortController(new AbortController())).toBeTruthy();
  });
});

describe("createProtobufSafeUpdater", () => {
  describe("with update message", () => {
    const schema = { output: Proto2MessageSchema };
    const update = create(Proto2MessageSchema, {
      int32Field: 999,
    });
    const safeUpdater = createProtobufSafeUpdater(schema, update);
    it("returns update message for previous value undefined", () => {
      const next = safeUpdater(undefined);
      expect(next).toBe(update);
    });
    it("returns update message for previous value", () => {
      const prev = create(Proto2MessageSchema, {
        int32Field: 123,
      });
      const next = safeUpdater(prev);
      expect(next).toBe(update);
    });
  });

  describe("with update message init", () => {
    const schema = { output: Proto2MessageSchema };
    const update = {
      int32Field: 999,
    };
    const safeUpdater = createProtobufSafeUpdater(schema, update);
    it("returns update message for previous value undefined", () => {
      const next = safeUpdater(undefined);
      expect(next?.int32Field).toBe(999);
    });
    it("returns update message for previous value", () => {
      const prev = create(Proto2MessageSchema, {
        int32Field: 123,
      });
      const next = safeUpdater(prev);
      expect(next?.$typeName).toBe(Proto2MessageSchema.typeName);
      expect(next?.int32Field).toBe(999);
    });
  });

  describe("with updater function", () => {
    const schema = { output: Proto2MessageSchema };
    const safeUpdater = createProtobufSafeUpdater(schema, (prev) => {
      if (prev === undefined) {
        return undefined;
      }
      return {
        ...prev,
        int32Field: 999,
      };
    });
    it("accepts undefined", () => {
      const next = safeUpdater(undefined);
      expect(next).toBeUndefined();
    });
    it("accepts previous message", () => {
      const prev = create(Proto2MessageSchema, {
        int32Field: 123,
      });
      const next = safeUpdater(prev);
      expect(next).toBeDefined();
    });
    it("returns message", () => {
      const prev = create(Proto2MessageSchema);
      const next = safeUpdater(prev);
      expect(isMessage(next, Proto2MessageSchema)).toBe(true);
    });
    it("updates field", () => {
      const prev = create(Proto2MessageSchema);
      const next = safeUpdater(prev);
      expect(next?.int32Field).toBe(999);
    });
    it("keeps existing fields", () => {
      const prev = create(Proto2MessageSchema, {
        stringField: "abc",
      });
      const next = safeUpdater(prev);
      expect(next?.stringField).toBe("abc");
    });
    describe("keeps field presence", () => {
      it("for unset field", () => {
        const prev = create(Proto2MessageSchema);
        expect(isFieldSet(prev, Proto2MessageSchema.field.stringField)).toBe(
          false
        );
        const next = safeUpdater(prev);
        const hasStringField =
          next === undefined
            ? undefined
            : isFieldSet(next, Proto2MessageSchema.field.stringField);
        expect(hasStringField).toBe(false);
      });
      it("for set field", () => {
        const prev = create(Proto2MessageSchema, {
          stringField: "abc",
        });
        expect(isFieldSet(prev, Proto2MessageSchema.field.stringField)).toBe(
          true
        );
        const next = safeUpdater(prev);
        const hasStringField =
          next === undefined
            ? undefined
            : isFieldSet(next, Proto2MessageSchema.field.stringField);
        expect(hasStringField).toBe(true);
      });
    });
  });
});

describe("createProtobufSafeInfiniteUpdater", () => {
  describe("with update message", () => {
    const schema = { output: Proto2MessageSchema };
    const update = {
      pageParams: [],
      pages: [
        {
          int32Field: 999,
        },
      ],
    };
    const safeUpdater = createProtobufSafeInfiniteUpdater(schema, update);
    it("returns update message for previous value undefined", () => {
      const next = safeUpdater(undefined);
      expect(next?.pages[0].$typeName).toBe("test.Proto2Message");
    });
  });

  describe("with update message init", () => {
    const schema = { output: Proto2MessageSchema };
    const update = {
      pageParams: [],
      pages: [
        {
          int32Field: 999,
        },
      ],
    };
    const safeUpdater = createProtobufSafeInfiniteUpdater(schema, update);
    it("returns update message for previous value undefined", () => {
      const next = safeUpdater(undefined);
      expect(next?.pages[0].int32Field).toBe(999);
    });
    it("returns update message for previous value", () => {
      const prev = {
        pageParams: [],
        pages: [
          create(Proto2MessageSchema, {
            int32Field: 123,
          }),
        ],
      };
      const next = safeUpdater(prev);
      expect(next?.pages[0].$typeName).toBe(Proto2MessageSchema.typeName);
      expect(next?.pages[0].int32Field).toBe(999);
    });
  });

  describe("with updater function", () => {
    const schema = { output: Proto2MessageSchema };
    const safeUpdater = createProtobufSafeInfiniteUpdater(schema, (prev) => {
      if (prev === undefined) {
        return undefined;
      }
      return {
        ...prev,
        int32Field: 999,
      };
    });
    it("accepts undefined", () => {
      const next = safeUpdater(undefined);
      expect(next).toBeUndefined();
    });
  });
});
