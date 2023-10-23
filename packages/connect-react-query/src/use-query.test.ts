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

import { describe, expect, it } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";

import { ElizaService } from "./gen/eliza_connect";
import { mockEliza, wrapper } from "./jest/test-utils";
import { useQuery, useSuspenseQuery } from "./use-query";
import { disableQuery } from "./utils";

// TODO: maybe create a helper to take a service and method and generate this.
const sayMethodDescriptor = {
  ...ElizaService.methods.say,
  localName: "Say",
  service: {
    typeName: ElizaService.typeName,
  },
};

const mockedElizaTransport = mockEliza();

const elizaWithDelayTransport = mockEliza(undefined, true);

describe("useQuery", () => {
  it("can query data", async () => {
    const { result } = renderHook(
      () => {
        return useQuery(sayMethodDescriptor, {
          sentence: "hello",
        });
      },
      wrapper({}, mockedElizaTransport)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(typeof result.current.data?.sentence).toBe("string");
  });

  it("can be disabled", () => {
    const { result } = renderHook(
      () => {
        return useQuery(sayMethodDescriptor, disableQuery);
      },
      wrapper(undefined, mockedElizaTransport)
    );
    expect(result.current.isPending).toBeTruthy();
    expect(result.current.isFetching).toBeFalsy();
  });

  it("can be provided a custom transport", async () => {
    const { result } = renderHook(
      () => {
        return useQuery(
          sayMethodDescriptor,
          {},
          {
            transport: mockEliza({
              sentence: "Intercepted!",
            }),
          }
        );
      },
      wrapper(undefined, mockedElizaTransport)
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
            placeholderData: new sayMethodDescriptor.O({
              sentence: "placeholder!",
            }),
          }
        );
      },
      wrapper(undefined, mockedElizaTransport)
    );
    expect(result.current.data?.sentence).toBe("placeholder!");
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
      wrapper({}, mockedElizaTransport)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(typeof result.current.data.sentence).toBe("string");
  });
});
