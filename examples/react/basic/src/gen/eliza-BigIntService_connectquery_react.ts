// Copyright 2021-2023 Buf Technologies, Inc.
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

// @generated by protoc-gen-connect-query-react v0.4.2 with parameter "target=ts,import_extension="
// @generated from file eliza.proto (package connectrpc.eliza.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { CountRequest, CountResponse } from "./eliza_pb";
import { MethodKind, PartialMessage } from "@bufbuild/protobuf";
import {
  ConnectQueryKey,
  createQueryService,
  useTransport,
} from "@connectrpc/connect-query";
import {
  QueryClient,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { ConnectError } from "@connectrpc/connect";

/**
 * @generated from service connectrpc.eliza.v1.BigIntService
 */
export const BigIntService = {
  typeName: "connectrpc.eliza.v1.BigIntService",
  methods: {
    /**
     * @generated from rpc connectrpc.eliza.v1.BigIntService.Count
     */
    count: {
      name: "Count",
      I: CountRequest,
      O: CountResponse,
      kind: MethodKind.Unary,
    },
  },
} as const;

const queryService = createQueryService({
  service: BigIntService,
});
/**
 * @generated from rpc connectrpc.eliza.v1.BigIntService.Count
 */
export const count = queryService.count;

export const useCountQuery = (
  input?: Parameters<typeof count.createUseQueryOptions>[0],
  options?: Parameters<typeof count.createUseQueryOptions>[1],
  queryOptions?: Partial<
    UseQueryOptions<
      CountResponse,
      ConnectError,
      CountResponse,
      ConnectQueryKey<CountRequest>
    >
  >,
) => {
  const transport = useTransport();
  const baseOptions = count.createUseQueryOptions(input, {
    transport,
    ...options,
  });

  return useQuery({
    ...baseOptions,
    ...queryOptions,
  });
};

export const useCountMutation = (
  options?: Parameters<typeof count.createUseMutationOptions>[0],
  queryOptions?: Partial<
    UseMutationOptions<
      PartialMessage<CountResponse>,
      ConnectError,
      PartialMessage<CountRequest>
    >
  >,
) => {
  const transport = useTransport();
  const baseOptions = count.createUseMutationOptions({ transport, ...options });

  return useMutation({
    ...baseOptions,
    ...queryOptions,
  });
};

export const useCountInfiniteQuery = (
  input: Parameters<typeof count.createUseInfiniteQueryOptions>[0],
  options: Parameters<typeof count.createUseInfiniteQueryOptions>[1],
  queryOptions?: Partial<
    UseInfiniteQueryOptions<
      CountResponse,
      ConnectError,
      CountResponse,
      CountResponse,
      ConnectQueryKey<CountRequest>
    >
  >,
) => {
  const transport = useTransport();
  const baseOptions = count.createUseInfiniteQueryOptions(input, {
    transport,
    ...options,
  });

  return useInfiniteQuery<
    CountResponse,
    ConnectError,
    CountResponse,
    keyof typeof input extends never ? any : ConnectQueryKey<CountRequest>
  >({
    ...baseOptions,
    ...queryOptions,
  });
};

export function useCountInvalidateQueries() {
  const queryClient = useQueryClient();

  return (
    input?: Parameters<typeof count.getQueryKey>[0],
    filters?: Parameters<QueryClient["invalidateQueries"]>[1],
    options?: Parameters<QueryClient["invalidateQueries"]>[2],
  ) => {
    return queryClient.invalidateQueries(
      count.getQueryKey(input),
      filters,
      options,
    );
  };
}
