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
import type { QueryFunctionContext } from "@tanstack/react-query";
import { useQueries } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";

import { callUnaryMethod } from "./call-unary-method";
import type { ConnectQueryKey } from "./connect-query-key";
import { createConnectQueryKey } from "./connect-query-key";
import { defaultOptions } from "./default-options";
import { ElizaService } from "./gen/eliza_connect";
import type { SayRequest } from "./gen/eliza_pb";
import { mockEliza, wrapper } from "./jest/test-utils";

const sayMethodDescriptor = {
  ...ElizaService.methods.say,
  service: {
    typeName: ElizaService.typeName,
  },
};

describe("callUnaryMethod", () => {
  it("can be used with useQueries", async () => {
    const { result } = renderHook(
      () => {
        const [query1] = useQueries({
          queries: [
            {
              queryKey: createConnectQueryKey(sayMethodDescriptor, {
                sentence: "query 1",
              }),
              queryFn: async ({
                queryKey,
                signal,
              }: QueryFunctionContext<ConnectQueryKey<SayRequest>>) => {
                const res = await callUnaryMethod(
                  sayMethodDescriptor,
                  queryKey[2],
                  {
                    transport: mockEliza({
                      sentence: "Response 1",
                    }),
                    callOptions: {
                      signal,
                    },
                  },
                );
                return res;
              },
            },
          ],
        });
        return {
          query1,
        };
      },
      wrapper({
        defaultOptions,
      }),
    );

    await waitFor(() => {
      expect(result.current.query1.isSuccess).toBeTruthy();
    });
    expect(result.current.query1.data?.sentence).toEqual("Response 1");
  });
});
