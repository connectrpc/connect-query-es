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

import { Nothing } from "./eliza_pb";
import { MethodKind, PartialMessage } from "@bufbuild/protobuf";
import { ConnectQueryKey, UnaryHooks } from "@connectrpc/connect-query";
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
 * @generated from service connectrpc.eliza.v1.Slouch
 */
export declare const Slouch: {
  readonly typeName: "connectrpc.eliza.v1.Slouch";
  readonly methods: {
    /**
     * @generated from rpc connectrpc.eliza.v1.Slouch.Work
     */
    readonly work: {
      readonly name: "Work";
      readonly I: typeof Nothing;
      readonly O: typeof Nothing;
      readonly kind: MethodKind.Unary;
    };
  };
};

export const work: UnaryHooks<Nothing, Nothing>;
export declare const useWorkQuery: (
  input: Parameters<typeof work.createUseQueryOptions>[0],
  options?: Parameters<typeof work.createUseQueryOptions>[1],
  queryOptions?: Partial<
    UseQueryOptions<Nothing, ConnectError, Nothing, ConnectQueryKey<Nothing>>
  >,
) => UseQueryResult<Nothing, ConnectError>;

export declare const useWorkMutation: (
  options?: Parameters<typeof work.createUseMutationOptions>[0],
  queryOptions?: Partial<
    UseMutationOptions<
      PartialMessage<Nothing>,
      ConnectError,
      PartialMessage<Nothing>
    >
  >,
) => UseMutationResult<Nothing, ConnectError, PartialMessage<Nothing>, unknown>;

export declare const useWorkInfiniteQuery: (
  input: Parameters<typeof work.createUseInfiniteQueryOptions>[0],
  options: Parameters<typeof work.createUseInfiniteQueryOptions>[1],
  queryOptions?: Partial<
    UseInfiniteQueryOptions<
      Nothing,
      ConnectError,
      Nothing,
      Nothing,
      ConnectQueryKey<Nothing>
    >
  >,
) => UseInfiniteQueryResult<Nothing, ConnectError>;

export declare function useWorkInvalidateQueries(): (
  input?: Parameters<typeof work.getQueryKey>[0],
  filters?: Parameters<QueryClient["invalidateQueries"]>[1],
  options?: Parameters<QueryClient["invalidateQueries"]>[2],
) => Promise<void>;
