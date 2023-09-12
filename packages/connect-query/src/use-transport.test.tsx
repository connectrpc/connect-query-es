// Copyright 2021-2023 Buf Technologies, Inc.
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

import { ConnectError } from "@connectrpc/connect";
import { describe, expect, it } from "@jest/globals";
import { useQuery } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { spyOn } from "jest-mock";

import { createUnaryFunctions } from "./create-unary-functions";
import { ElizaService } from "./gen/eliza_connect";
import { mockBigInt, sleep, wrapper } from "./jest/test-utils";
import {
  fallbackTransport,
  TransportProvider,
  useTransport,
} from "./use-transport";

const error = new ConnectError(
  "To use Connect, you must provide a `Transport`: a simple object that handles `unary` and `stream` requests. `Transport` objects can easily be created by using `@connectrpc/connect-web`'s exports `createConnectTransport` and `createGrpcWebTransport`. see: https://connectrpc.com/docs/web/getting-started for more info.",
);

describe("fallbackTransport", () => {
  it("throws a helpful error message", async () => {
    await expect(Promise.reject(fallbackTransport.unary)).rejects.toThrow(
      error,
    );
    await expect(Promise.reject(fallbackTransport.stream)).rejects.toThrow(
      error,
    );
  });
});

describe("useTransport", () => {
  const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
  const say = createUnaryFunctions({
    methodInfo: ElizaService.methods.say,
    typeName: ElizaService.typeName,
  });

  it("throws the fallback error", async () => {
    const { result, rerender } = renderHook(
      () =>
        useQuery({
          ...say.createUseQueryOptions(undefined, {
            transport: fallbackTransport,
          }),
          retry: false,
        }),
      wrapper(),
    );
    rerender();

    expect(result.current.error).toStrictEqual(null);
    expect(result.current.isError).toStrictEqual(false);
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    await sleep(10);

    expect(result.current.error).toEqual(error);
    expect(result.current.isError).toStrictEqual(true);
    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
  });
});

describe("TransportProvider", () => {
  it("provides a custom transport to the useTransport hook", () => {
    const transport = mockBigInt();
    const { result } = renderHook(() => useTransport(), {
      wrapper: ({ children }) => (
        <TransportProvider transport={transport}>{children}</TransportProvider>
      ),
    });
    expect(result.current).toBe(transport);
  });
});
