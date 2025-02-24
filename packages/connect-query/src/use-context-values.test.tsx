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

import { renderHook, waitFor } from "@testing-library/react";
import {
  ElizaService,
  SayResponseSchema,
  type SayRequest,
} from "test-utils/gen/eliza_pb.js";
import { describe, expect, it, vi } from "vitest";

import { wrapper } from "./test/test-wrapper.js";
import { useQuery } from "./use-query.js";
import { create } from "@bufbuild/protobuf";
import {
  createContextKey,
  createRouterTransport,
  type ContextKey,
} from "@connectrpc/connect";
import { useContextValue, useContextValues } from "./use-context-values.js";

const contextKey = createContextKey("some-default-value", {
  description: "A context key",
});

describe("useContextValues", () => {
  it("reads default context when no context provided", async () => {
    const { contextReader, transport } = createTransportWithContext(contextKey);
    const { result } = renderHook(
      () => {
        return useQuery(ElizaService.method.say, {
          sentence: "hello",
        });
      },
      wrapper({}, transport)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(contextReader).toHaveBeenCalledTimes(1);
    expect(contextReader).toHaveBeenCalledWith("some-default-value");

    expect(typeof result.current.data?.sentence).toBe("string");
  });

  it("allows context to be tracked", async () => {
    const { contextReader, transport, calls } = createTransportWithContext(contextKey);
    const { result } = renderHook(
      () => {
        let ctxValues = useContextValues([contextKey]);
        ctxValues = useContextValue(ctxValues, contextKey, "some-value");
        return useQuery(
          ElizaService.method.say,
          {
            sentence: "hello",
          },
          {
            contextValues: ctxValues,
          }
        );
      },
      wrapper({}, transport)
    );
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });
    expect(calls).toHaveBeenCalledTimes(1);
    expect(contextReader).toHaveBeenCalledTimes(1);
    expect(contextReader).toHaveBeenCalledWith("some-value");

    expect(typeof result.current.data?.sentence).toBe("string");
  });

  it("allows setting context via interceptor", async () => {
    const { contextReader, transport, calls } = createTransportWithContext(contextKey, "post-interceptor-value");
    const { result } = renderHook(
      () => {
        const ctxValues = useContextValues([contextKey]);

        return useQuery(
          ElizaService.method.say,
          {
            sentence: "hello",
          },
          {
            contextValues: ctxValues,
          }
        );
      },
      wrapper({}, transport)
    );
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });
    await waitFor(() => new Promise(resolve => setTimeout(resolve, 10)));
    expect(calls).toHaveBeenCalledTimes(2);
    expect(contextReader).toHaveBeenCalledTimes(2);
    expect(contextReader).toHaveBeenNthCalledWith(1, "some-default-value");
    expect(contextReader).toHaveBeenNthCalledWith(2, "post-interceptor-value");
    expect(typeof result.current.data?.sentence).toBe("string");
  });
});

function createTransportWithContext(contextKey: ContextKey<string>, setContextTo?: string) {
  const contextReader = vi.fn();
  const calls = vi.fn();
  const transport = createRouterTransport(
    ({ service }) => {
      service(ElizaService, {
        say: (input: SayRequest) => {
          calls(input);
          return create(SayResponseSchema, {
            sentence: `Hello ${input.sentence}`,
          });
        },
      });
    },
    {
      transport: {
        interceptors: [
          (next) => (req) => {
            contextReader(req.contextValues.get(contextKey));
            if (setContextTo !== undefined && req.contextValues.get(contextKey) !== setContextTo) {
              req.contextValues.set(contextKey, setContextTo);
            }
            return next(req);
          },
        ],
      },
    }
  );
  return {
    transport,
    contextReader,
    calls,
  };
}
