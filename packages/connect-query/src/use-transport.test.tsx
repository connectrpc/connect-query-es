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

import { ConnectError } from "@connectrpc/connect";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ElizaService } from "./gen/eliza_connect.js";
import { mockBigInt, wrapper } from "./test/test-utils.js";
import { useQuery } from "./use-query.js";
import { TransportProvider, useTransport } from "./use-transport.js";

const sayMethodDescriptor = {
  ...ElizaService.methods.say,
  localName: "Say",
  service: {
    typeName: ElizaService.typeName,
  },
};

const error = new ConnectError(
  "To use Connect, you must provide a `Transport`: a simple object that handles `unary` and `stream` requests. `Transport` objects can easily be created by using `@connectrpc/connect-web`'s exports `createConnectTransport` and `createGrpcWebTransport`. see: https://connectrpc.com/docs/web/getting-started for more info.",
);

describe("useTransport", () => {
  it("throws the fallback error", async () => {
    const { result, rerender } = renderHook(
      () => useQuery(sayMethodDescriptor, undefined, { retry: false }),
      {
        wrapper: wrapper().queryClientWrapper,
      },
    );
    rerender();

    expect(result.current.error).toStrictEqual(null);
    expect(result.current.isError).toStrictEqual(false);

    await waitFor(() => {
      expect(result.current.isError).toStrictEqual(true);
    });

    expect(result.current.error).toEqual(error);
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
