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
import {
  createConnectQueryKey,
  skipToken,
  type SerializableContextValues,
} from "@connectrpc/connect-query-core";
import { renderHook, waitFor } from "@testing-library/react";
import { mockBigInt, mockEliza } from "test-utils";
import { BigIntService } from "test-utils/gen/bigint_pb.js";
import { ElizaService } from "test-utils/gen/eliza_pb.js";
import { describe, expect, it, vi } from "vitest";

import { wrapper } from "./test/test-wrapper.js";
import { useQuery, useSuspenseQuery } from "./use-query.js";
import { createContextKey, createContextValues } from "@connectrpc/connect";

// TODO: maybe create a helper to take a service and method and generate this.
const sayMethodDescriptor = ElizaService.method.say;

const mockedElizaTransport = mockEliza();

const bigintTransport = mockBigInt();

const elizaWithDelayTransport = mockEliza(undefined, true);

describe("useQuery", () => {
  it("can query data", async () => {
    const { result } = renderHook(
      () => {
        return useQuery(sayMethodDescriptor, {
          sentence: "hello",
        });
      },
      wrapper({}, mockedElizaTransport),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(typeof result.current.data?.sentence).toBe("string");
  });

  it("can be disabled", () => {
    const { result } = renderHook(
      () => {
        return useQuery(sayMethodDescriptor, skipToken);
      },
      wrapper(undefined, mockedElizaTransport),
    );
    expect(result.current.isPending).toBeTruthy();
    expect(result.current.isFetching).toBeFalsy();
  });

  it("can be provided a custom transport", async () => {
    const transport = mockEliza({
      sentence: "Intercepted!",
    });
    const { result } = renderHook(
      () => {
        return useQuery(
          sayMethodDescriptor,
          {},
          {
            transport,
          },
        );
      },
      wrapper(undefined, mockedElizaTransport),
    );
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(result.current.data?.sentence).toBe("Intercepted!");
  });

  it("can be provided other props for react-query", () => {
    const { result } = renderHook(
      () => {
        return useQuery(
          sayMethodDescriptor,
          {},
          {
            transport: elizaWithDelayTransport,
            placeholderData: create(sayMethodDescriptor.output, {
              sentence: "placeholder!",
            }),
          },
        );
      },
      wrapper(undefined, mockedElizaTransport),
    );
    expect(result.current.data?.sentence).toBe("placeholder!");
  });

  it("can be used along with the select", async () => {
    const { result } = renderHook(
      () => {
        return useQuery(
          sayMethodDescriptor,
          {},
          {
            select: (data) => data.sentence.length,
          },
        );
      },
      wrapper(undefined, mockedElizaTransport),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(result.current.data).toBe(6);
  });

  it("can be disabled with enabled: false", () => {
    const { result } = renderHook(
      () => {
        return useQuery(
          sayMethodDescriptor,
          {
            sentence: "hello",
          },
          {
            enabled: false,
          },
        );
      },
      wrapper({}, mockedElizaTransport),
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isPending).toBeTruthy();
    expect(result.current.isFetching).toBeFalsy();
  });

  it("can be disabled with enabled: false in QueryClient default options", () => {
    const { result } = renderHook(
      () => {
        return useQuery(sayMethodDescriptor, {
          sentence: "hello",
        });
      },
      wrapper(
        {
          defaultOptions: {
            queries: {
              enabled: false,
            },
          },
        },
        mockedElizaTransport,
      ),
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isPending).toBeTruthy();
    expect(result.current.isFetching).toBeFalsy();
  });

  it("can be disabled with skipToken", () => {
    const { result } = renderHook(
      () => {
        return useQuery(sayMethodDescriptor, skipToken);
      },
      wrapper({}, mockedElizaTransport),
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isPending).toBeTruthy();
    expect(result.current.isFetching).toBeFalsy();
  });

  it("supports schemas with bigint keys", async () => {
    const { result } = renderHook(
      () => {
        return useQuery(BigIntService.method.count, {
          add: 2n,
        });
      },
      wrapper({}, bigintTransport),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(result.current.data?.count).toBe(1n);
  });

  it("data can be fetched from cache", async () => {
    const { queryClient, ...rest } = wrapper({}, bigintTransport);
    const { result } = renderHook(() => {
      return useQuery(BigIntService.method.count, {});
    }, rest);

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(
      queryClient.getQueryData(
        createConnectQueryKey({
          schema: BigIntService.method.count,
          input: {},
          transport: bigintTransport,
          cardinality: "finite",
        }),
      ),
    ).toBe(result.current.data);
  });

  it("context values can be passed", async () => {
    const contextValueSpy = vi.fn();
    const contextKey = createContextKey("contextKey", {
      description: "default",
    });
    const baseContextValues = createContextValues().set(
      contextKey,
      "new value",
    );
    const fakeContextValues: SerializableContextValues = {
      ...baseContextValues,
      toString() {
        return "serialized";
      },
    };
    const elizaWithInterceptors = mockEliza(undefined, false, {
      interceptors: [
        (next) => (req) => {
          contextValueSpy(req.contextValues.get(contextKey));
          return next(req);
        },
      ],
    });
    const { result } = renderHook(
      () => {
        return useQuery(
          ElizaService.method.say,
          {},
          { contextValues: fakeContextValues },
        );
      },
      wrapper({}, elizaWithInterceptors),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(contextValueSpy).toHaveBeenCalledWith("new value");
    expect(contextValueSpy).toHaveBeenCalledTimes(1);
  });
});

describe("useSuspenseQuery", () => {
  it("can query data", async () => {
    const { result } = renderHook(
      () => {
        return useSuspenseQuery(sayMethodDescriptor, {
          sentence: "hello",
        });
      },
      wrapper({}, mockedElizaTransport),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(typeof result.current.data.sentence).toBe("string");
  });

  it("can be used along with the select", async () => {
    const { result } = renderHook(
      () => {
        return useSuspenseQuery(
          sayMethodDescriptor,
          {
            sentence: "hello",
          },
          {
            select: (data) => data.sentence.length,
          },
        );
      },
      wrapper({}, mockedElizaTransport),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(result.current.data).toBe(11);
  });
});
