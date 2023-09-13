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

import type { MethodInfo, PartialMessage } from "@bufbuild/protobuf";
import { describe, expect, it } from "@jest/globals";
import type { QueryFunctionContext } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";

import type { ConnectQueryKey } from "./connect-query-key";
import { createQueryService } from "./create-query-service";
import { ElizaService } from "./gen/eliza_connect";
import type { SayRequest, SayResponse } from "./gen/eliza_pb";
import type { Equal, Expect } from "./jest/test-utils";
import { mockEliza, wrapper } from "./jest/test-utils";
import { isUnaryMethod } from "./utils";

describe("createQueryService", () => {
  const service = ElizaService;
  const methodName = "say";
  const input = { sentence: "ziltoid" } satisfies PartialMessage<SayResponse>;

  it("uses a custom transport", async () => {
    const transport = mockEliza();
    const { result } = renderHook(async () => {
      const { queryFn } = createQueryService({
        service,
        transport,
      }).say.useQuery(input);
      return queryFn();
    }, wrapper());

    const response = await result.current;

    expect(response.sentence).toEqual(`Hello ${input.sentence}`);
  });

  it("contains the right options", () => {
    const hook = createQueryService({ service });

    const unaryMethods = Object.keys(service.methods).filter((key) =>
      isUnaryMethod(
        service.methods[key as keyof typeof service.methods] as MethodInfo,
      ),
    );
    expect(Object.keys(hook)).toHaveLength(unaryMethods.length);

    expect(hook).toHaveProperty(
      methodName,
      expect.objectContaining({
        methodInfo: service.methods[methodName],
        useQuery: expect.any(Function),
      }),
    );
  });

  describe("useQuery", () => {
    it("has the appropriate properties", () => {
      const {
        result: { current: queryOptions },
      } = renderHook(
        () => createQueryService({ service }).say.useQuery(input),
        wrapper(),
      );

      type ExpectType_Enabled = Expect<
        Equal<typeof queryOptions.enabled, boolean>
      >;
      expect(queryOptions).toHaveProperty("enabled", true);

      type ExpectType_QueryKey = Expect<
        Equal<typeof queryOptions.queryKey, ConnectQueryKey<SayRequest>>
      >;
      expect(queryOptions).toHaveProperty("queryKey", [
        service.typeName,
        service.methods[methodName].name,
        input,
      ]);

      type ExpectType_QueryFn = Expect<
        Equal<
          typeof queryOptions.queryFn,
          (
            context?:
              | QueryFunctionContext<ConnectQueryKey<SayRequest>>
              | undefined,
          ) => Promise<SayResponse>
        >
      >;
      expect(queryOptions).toHaveProperty("queryFn", expect.any(Function));
    });
  });
});
