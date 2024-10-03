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

import { createConnectTransport } from "@connectrpc/connect-web";
import { describe, expect, it } from "vitest";

import { createTransportKey } from "./transport-key.js";

describe("transport key", () => {
  it("returns the same key for the same reference", () => {
    const transport = createConnectTransport({
      baseUrl: "https://example.com",
    });
    const key1 = createTransportKey(transport);
    const key2 = createTransportKey(transport);
    expect(key1).toBe(key2);
  });
  it("creates a unique key for every reference", () => {
    const transport1 = createConnectTransport({
      baseUrl: "https://example.com",
    });
    const transport2 = createConnectTransport({
      baseUrl: "https://example.com",
    });
    const key1 = createTransportKey(transport1);
    const key2 = createTransportKey(transport2);
    expect(key1).not.toBe(key2);
  });
});
