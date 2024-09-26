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
import { describe, expect, it, vi } from "vitest";

import { defaultOptions } from "./default-options.js";
import { BigIntService, PaginatedService } from "./gen/eliza_connect.js";
import {
  mockPaginatedTransport,
  mockStatefulBigIntTransport,
  wrapper,
} from "./test/test-utils.js";
import { useMutation } from "./use-mutation.js";

// TODO: maybe create a helper to take a service and method and generate this.
const methodDescriptor = {
  ...PaginatedService.methods.list,
  localName: "List",
  service: {
    typeName: PaginatedService.typeName,
  },
};

const mockedPaginatedTransport = mockPaginatedTransport();
const mutationTransport = mockStatefulBigIntTransport(true);

const statefulDescriptor = {
  ...BigIntService.methods.count,
  service: {
    typeName: BigIntService.typeName,
  },
};

describe("useMutation", () => {
  it("performs a mutation", async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(
      () => {
        return useMutation(methodDescriptor, {
          onSuccess,
        });
      },
      wrapper(
        {
          defaultOptions,
        },
        mockedPaginatedTransport,
      ),
    );

    result.current.mutate({
      page: 0n,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(onSuccess).toHaveBeenCalledWith(
      {
        items: ["-2 Item", "-1 Item", "0 Item"],
        page: 0n,
      },
      {
        page: 0n,
      },
      undefined,
    );
  });

  it("can be provided a custom transport", async () => {
    const { result } = renderHook(
      () => {
        return useMutation(methodDescriptor, {
          transport: mockPaginatedTransport({
            page: 1n,
            items: ["Intercepted!"],
          }),
        });
      },
      wrapper(
        {
          defaultOptions,
        },
        mockedPaginatedTransport,
      ),
    );

    result.current.mutate({
      page: 0n,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(result.current.data?.items[0]).toBe("Intercepted!");
  });

  it("can be cancelled", async () => {
    const abortController = new AbortController();
    const { result } = renderHook(
      () => {
        return useMutation(statefulDescriptor, {
          callOptions: {
            signal: abortController.signal,
          },
        });
      },
      wrapper(
        {
          defaultOptions,
        },
        mutationTransport,
      ),
    );

    result.current.mutate({
      add: 1n,
    });

    abortController.abort();

    await waitFor(() => {
      expect(abortController.signal.aborted).toBeTruthy();
    });

    expect(result.current.isPending).toBeFalsy();

    const newResult = await mutationTransport.unary(
      BigIntService,
      BigIntService.methods.getCount,
      undefined,
      undefined,
      undefined,
      {},
    );

    expect(newResult.message.count).toBe(0n);
  });

  it("can forward onMutate params", async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(
      () => {
        return useMutation(methodDescriptor, {
          onMutate: (variables) => {
            return {
              somethingElse: `Some additional context: ${(variables.page ?? 0n) + 2n}`,
            };
          },
          onSuccess: (data, variables, context) => {
            onSuccess(data, variables, context);
            // Customizing on success so we can test the types
            expect(context.somethingElse).toBe("Some additional context: 2");
          },
        });
      },
      wrapper(
        {
          defaultOptions,
        },
        mockedPaginatedTransport,
      ),
    );

    result.current.mutate({
      page: 0n,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(onSuccess).toHaveBeenCalledWith(
      {
        items: ["-2 Item", "-1 Item", "0 Item"],
        page: 0n,
      },
      {
        page: 0n,
      },
      { somethingElse: "Some additional context: 2" },
    );
  });
});
