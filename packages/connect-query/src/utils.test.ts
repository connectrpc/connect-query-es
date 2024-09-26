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

import { create, type MessageInitShape } from "@bufbuild/protobuf";
import { describe, expect, expectTypeOf, it, vi } from "vitest";

import {
  BigIntService,
  type CountResponse,
  type CountResponseSchema,
} from "./gen/bigint_pb.js";
import {
  assert,
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
      isAbortController({ signal: { aborted: true }, abort: undefined }),
    ).toBeFalsy();
  });

  it("returns true for the two necessary AbortController properties", () => {
    expect(
      isAbortController({
        signal: {
          aborted: false,
        },
        abort: () => {},
      }),
    ).toBeTruthy();

    expect(isAbortController(new AbortController())).toBeTruthy();
  });
});

describe("protobufSafeUpdater", () => {
  const { count: methodInfo } = BigIntService.method;
  const input: MessageInitShape<typeof CountResponseSchema> = {
    count: 1n,
  };
  const wrappedInput = create(methodInfo.output, input);

  const output: MessageInitShape<typeof CountResponseSchema> = {
    count: 2n,
  };
  const wrappedOutput = create(methodInfo.output, output);

  it("handles a MessageInitShape updater", () => {
    const updater = output;
    const safeUpdater = createProtobufSafeUpdater(methodInfo, updater);

    expectTypeOf(safeUpdater).toEqualTypeOf<
      (prev?: CountResponse) => CountResponse
    >();
    expect(typeof safeUpdater).toStrictEqual("function");

    const result = safeUpdater(wrappedInput);
    expectTypeOf(result).toEqualTypeOf<CountResponse>();
    expect(result).not.toStrictEqual(wrappedInput);

    expectTypeOf(result.count).toEqualTypeOf<bigint>();
    expect(wrappedInput.count).toStrictEqual(1n);
    expect(result.count).toStrictEqual(2n);
    expect(result).toStrictEqual(wrappedOutput);
    expect(result).toHaveProperty("$typeName");
  });

  it("handles a function updater", () => {
    const updater = vi.fn(() => create(methodInfo.output, { count: 2n }));
    const safeUpdater = createProtobufSafeUpdater(methodInfo, updater);

    expectTypeOf(safeUpdater).toEqualTypeOf<
      (prev?: CountResponse) => CountResponse
    >();
    expect(typeof safeUpdater).toStrictEqual("function");

    const result = safeUpdater(wrappedInput);
    expect(updater).toHaveBeenCalledWith(wrappedInput);
    expectTypeOf(result).toEqualTypeOf<CountResponse>();
    expect(result).not.toStrictEqual(wrappedInput);

    expectTypeOf(result.count).toEqualTypeOf<bigint>();

    expect(wrappedInput.count).toStrictEqual(1n);
    expect(result.count).toStrictEqual(2n);
    expect(result).toStrictEqual(wrappedOutput);
    expect(result).toHaveProperty("$typeName");
  });
});
