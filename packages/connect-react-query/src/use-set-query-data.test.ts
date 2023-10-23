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

import type { PlainMessage } from "@bufbuild/protobuf";
import { describe, expect, it } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";

import { createConnectQueryKey } from "./connect-query-key";
import { ElizaService } from "./gen/eliza_connect";
import type { SayRequest } from "./gen/eliza_pb";
import { mockEliza, wrapper } from "./jest/test-utils";
import { useQuery } from "./use-query";
import { useSetQueryData } from "./use-set-query-data";

const methodDescriptor = {
  ...ElizaService.methods.say,
  localName: "Say",
  service: {
    typeName: ElizaService.typeName,
  },
};

/**
 * Helper to initialize some data and return the updater and a function to get
 * the latest data.
 */
async function queryClientSetup(input?: PlainMessage<SayRequest>) {
  const { queryClient, ...rest } = wrapper(
    undefined,
    mockEliza({
      sentence: "Hello, world!",
    }),
  );
  const { result } = renderHook(() => {
    const query = useQuery(methodDescriptor, input);
    return {
      updater: useSetQueryData(methodDescriptor),
      query,
    };
  }, rest);

  function getLatestData(localOverride?: PlainMessage<SayRequest>) {
    return queryClient.getQueryData(
      createConnectQueryKey(methodDescriptor, localOverride ?? input),
    );
  }

  expect(getLatestData()).toBeUndefined();

  await waitFor(() => {
    expect(result.current.query.status).toBe("success");
  });

  expect(getLatestData()).toEqual({
    sentence: "Hello, world!",
  });

  return {
    updater: result.current.updater,
    getLatestData,
  };
}

describe("useSetQueryData", () => {
  describe("no specific input", () => {
    it("updates query client data", async () => {
      const { updater, getLatestData } = await queryClientSetup();

      updater({
        sentence: "Goodbye, world!",
      });

      expect(getLatestData()).toEqual({
        sentence: "Goodbye, world!",
      });
    });

    it("receives the previous data in callback form", async () => {
      const { updater, getLatestData } = await queryClientSetup();

      updater((prev) => ({
        sentence: prev?.sentence + " -- Goodbye, world!",
      }));

      expect(getLatestData()).toEqual({
        sentence: "Hello, world! -- Goodbye, world!",
      });
    });

    it("doesn't set alternate keys", async () => {
      const { updater, getLatestData } = await queryClientSetup();

      updater(
        (prev) => ({
          sentence: (prev?.sentence ?? "") + " -- Goodbye, world!",
        }),
        {
          sentence: "some other input",
        },
      );

      expect(getLatestData()).toEqual({
        sentence: "Hello, world!",
      });
      expect(
        getLatestData({
          sentence: "some other input",
        }),
      ).toEqual({
        sentence: " -- Goodbye, world!",
      });
    });
  });

  describe("specified input", () => {
    it("updates query client data", async () => {
      const { updater, getLatestData } = await queryClientSetup({
        sentence: "some-input",
      });

      updater(
        {
          sentence: "Goodbye, world!",
        },
        {
          sentence: "some-input",
        },
      );

      expect(getLatestData()).toEqual({
        sentence: "Goodbye, world!",
      });
    });

    it("receives the previous data in callback form", async () => {
      const { updater, getLatestData } = await queryClientSetup({
        sentence: "some-input",
      });

      updater(
        (prev) => ({
          sentence: prev?.sentence + " -- Goodbye, world!",
        }),
        {
          sentence: "some-input",
        },
      );

      expect(getLatestData()).toEqual({
        sentence: "Hello, world! -- Goodbye, world!",
      });
    });
  });
});
