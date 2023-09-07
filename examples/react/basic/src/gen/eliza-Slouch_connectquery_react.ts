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

import { Nothing } from "./eliza_pb";
import { MethodKind, PartialMessage } from "@bufbuild/protobuf";
import { ConnectQueryKey, createQueryService } from "@connectrpc/connect-query";
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
 * @generated from service connectrpc.eliza.v1.Slouch
 */
export const Slouch = {
  typeName: "connectrpc.eliza.v1.Slouch",
  methods: {
    /**
     * @generated from rpc connectrpc.eliza.v1.Slouch.Work
     */
    work: {
      name: "Work",
      I: Nothing,
      O: Nothing,
      kind: MethodKind.Unary,
    },
  },
} as const;

const queryService = createQueryService({
  service: Slouch,
});
/**
 * @generated from rpc connectrpc.eliza.v1.Slouch.Work
 */
export const work = queryService.work;

export const useWorkQuery = (
  input?: Parameters<typeof work.useQuery>[0],
  options?: Parameters<typeof work.useQuery>[1],
  queryOptions?: Partial<
    UseQueryOptions<Nothing, ConnectError, Nothing, ConnectQueryKey<Nothing>>
  >,
) => {
  const baseOptions = work.useQuery(input, options);

  return useQuery({
    ...baseOptions,
    ...queryOptions,
  });
};

export const useWorkMutation = (
  options?: Parameters<typeof work.useMutation>[0],
  queryOptions?: Partial<
    UseMutationOptions<
      PartialMessage<Nothing>,
      ConnectError,
      PartialMessage<Nothing>
    >
  >,
) => {
  const baseOptions = work.useMutation(options);

  return useMutation({
    ...baseOptions,
    ...queryOptions,
  });
};

export const useWorkInfiniteQuery = (
  input: Parameters<typeof work.useInfiniteQuery>[0],
  options: Parameters<typeof work.useInfiniteQuery>[1],
  queryOptions?: Partial<
    UseInfiniteQueryOptions<
      Nothing,
      ConnectError,
      Nothing,
      Nothing,
      ConnectQueryKey<Nothing>
    >
  >,
) => {
  const baseOptions = work.useInfiniteQuery(input, options);

  return useInfiniteQuery<
    Nothing,
    ConnectError,
    Nothing,
    keyof typeof input extends never ? any : ConnectQueryKey<Nothing>
  >({
    ...baseOptions,
    ...queryOptions,
  });
};

export function useWorkInvalidateQueries() {
  const queryClient = useQueryClient();

  return (
    input?: Parameters<typeof work.getQueryKey>[0],
    filters?: Parameters<QueryClient["invalidateQueries"]>[1],
    options?: Parameters<QueryClient["invalidateQueries"]>[2],
  ) => {
    return queryClient.invalidateQueries(
      work.getQueryKey(input),
      filters,
      options,
    );
  };
}
