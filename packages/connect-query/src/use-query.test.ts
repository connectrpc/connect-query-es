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
} from "@connectrpc/connect-query-core";
import { renderHook, waitFor } from "@testing-library/react";
import { mockBigInt, mockEliza } from "test-utils";
import { BigIntService } from "test-utils/gen/bigint_pb.js";
import { ElizaService } from "test-utils/gen/eliza_pb.js";
import { describe, expect, it } from "vitest";

import { wrapper } from "./test/test-wrapper.js";
import { useQuery, useSuspenseQuery } from "./use-query.js";

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

  it("can pass headers through", async () => {
    let resolve: () => void;
    const promise = new Promise<void>((res) => {
      resolve = res;
    });
    const transport = mockEliza(
      {
        sentence: "Response 1",
      },
      false,
      {
        router: {
          interceptors: [
            (next) => (req) => {
              expect(req.header.get("x-custom-header")).toEqual("custom-value");
              resolve();
              return next(req);
            },
          ],
        },
      },
    );
    const { result } = renderHook(
      () => {
        return useSuspenseQuery(
          sayMethodDescriptor,
          {
            sentence: "hello",
          },
          {
            transport,
            headers: {
              "x-custom-header": "custom-value",
            },
          },
        );
      },
      wrapper({}, mockedElizaTransport),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    await promise;

    expect(result.current.data.sentence).toBe("Response 1");
  });
});
