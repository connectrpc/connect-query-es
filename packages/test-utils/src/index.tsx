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

import type { MessageInitShape } from "@bufbuild/protobuf";
import { create } from "@bufbuild/protobuf";
import { createRouterTransport, type ConnectRouterOptions } from "@connectrpc/connect";

import {
  BigIntService,
  type CountRequest,
  CountResponseSchema,
} from "./gen/bigint_pb.js";
import {
  ElizaService,
  type SayRequest,
  SayResponseSchema,
} from "./gen/eliza_pb.js";
import { type ListResponseSchema, ListService } from "./gen/list_pb.js";

/**
 * A test-only helper to increase time (necessary for testing react-query)
 */
export const sleep = async (timeout: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });

/**
 * a stateless mock for ElizaService
 */
export const mockEliza = (
  override?: MessageInitShape<typeof SayResponseSchema>,
  addDelay = false,
  options?: {
    router?: ConnectRouterOptions;
  },
) =>
  createRouterTransport(({ service }) => {
    service(ElizaService, {
      say: async (input: SayRequest) => {
        if (addDelay) {
          await sleep(1000);
        }
        return create(
          SayResponseSchema,
          override ?? { sentence: `Hello ${input.sentence}` },
        );
      },
    });
  }, { 
    router: options?.router,
  });

/**
 * a stateless mock for BigIntService
 */
export const mockBigInt = () =>
  createRouterTransport(({ service }) => {
    service(BigIntService, {
      count: () => create(CountResponseSchema, { count: 1n }),
    });
  });

/**
 * a mock for BigIntService that acts as an impromptu database
 */
export const mockStatefulBigIntTransport = (addDelay = false) =>
  createRouterTransport(({ service }) => {
    let count = 0n;
    service(BigIntService, {
      count: async (request?: CountRequest) => {
        if (addDelay) {
          await sleep(1000);
        }
        if (request) {
          count += request.add;
        }
        return create(CountResponseSchema, { count });
      },
      getCount: () => create(CountResponseSchema, { count }),
    });
  });

/**
 * a mock for PaginatedService that acts as an impromptu database
 */
export const mockPaginatedTransport = (
  override?: MessageInitShape<typeof ListResponseSchema>,
  addDelay = false,
  options?: {
    router?: ConnectRouterOptions;
  },
) =>
  createRouterTransport(({ service }) => {
    service(ListService, {
      list: async (request) => {
        if (addDelay) {
          await sleep(1000);
        }
        if (override !== undefined) {
          return override;
        }
        const base = (request.page - 1n) * 3n;
        const result = {
          page: request.page,
          items: [
            `${base + 1n} Item`,
            `${base + 2n} Item`,
            `${base + 3n} Item`,
          ],
        };
        return result;
      },
    });
  }, {
    router: options?.router,
  });
