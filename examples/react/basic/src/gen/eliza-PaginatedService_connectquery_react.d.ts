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

// @generated by protoc-gen-connect-query-react v0.4.2 with parameter "target=dts,import_extension="
// @generated from file eliza.proto (package connectrpc.eliza.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { ListRequest, ListResponse } from "./eliza_pb";
import { MethodKind, PartialMessage } from "@bufbuild/protobuf";
import { ConnectQueryKey, UnaryFunctions } from "@connectrpc/connect-query";
import {
  QueryClient,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { ConnectError } from "@connectrpc/connect";

/**
 * @generated from service connectrpc.eliza.v1.PaginatedService
 */
export declare const PaginatedService: {
  readonly typeName: "connectrpc.eliza.v1.PaginatedService";
  readonly methods: {
    /**
     * @generated from rpc connectrpc.eliza.v1.PaginatedService.List
     */
    readonly list: {
      readonly name: "List";
      readonly I: typeof ListRequest;
      readonly O: typeof ListResponse;
      readonly kind: MethodKind.Unary;
    };
  };
};

export const list: UnaryFunctions<ListRequest, ListResponse>;
export declare const useListQuery: (
  input: Parameters<typeof list.createUseQueryOptions>[0],
  options?: Parameters<typeof list.createUseQueryOptions>[1],
  queryOptions?: Partial<
    UseQueryOptions<
      ListResponse,
      ConnectError,
      ListResponse,
      ConnectQueryKey<ListRequest>
    >
  >,
) => UseQueryResult<ListResponse, ConnectError>;

export declare const useListMutation: (
  options?: Parameters<typeof list.createUseMutationOptions>[0],
  queryOptions?: Partial<
    UseMutationOptions<
      PartialMessage<ListResponse>,
      ConnectError,
      PartialMessage<ListRequest>
    >
  >,
) => UseMutationResult<
  ListResponse,
  ConnectError,
  PartialMessage<ListRequest>,
  unknown
>;

export declare const useListInfiniteQuery: (
  input: Parameters<typeof list.createUseInfiniteQueryOptions>[0],
  options: Parameters<typeof list.createUseInfiniteQueryOptions>[1],
  queryOptions?: Partial<
    UseInfiniteQueryOptions<
      ListResponse,
      ConnectError,
      ListResponse,
      ListResponse,
      ConnectQueryKey<ListRequest>
    >
  >,
) => UseInfiniteQueryResult<ListResponse, ConnectError>;

export declare function useListInvalidateQueries(): (
  input?: Parameters<typeof list.getQueryKey>[0],
  filters?: Parameters<QueryClient["invalidateQueries"]>[1],
  options?: Parameters<QueryClient["invalidateQueries"]>[2],
) => Promise<void>;
