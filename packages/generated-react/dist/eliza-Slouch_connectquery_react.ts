// Copyright 2021-2022 Buf Technologies, Inc.
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

// @generated by protoc-gen-connect-query-react v0.0.2 with parameter "target=ts,import-hook-from=@tanstack/react-query"
// @generated from file eliza.proto (package connectrpc.eliza.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { createQueryService } from "@bufbuild/connect-query";
import { MethodKind, PartialMessage } from "@bufbuild/protobuf";
import { Nothing } from "./eliza_pb.js";
import { UseBaseQueryOptions, useInfiniteQuery, UseInfiniteQueryOptions, useMutation, UseMutationOptions, useQuery } from "@tanstack/react-query";
import { ConnectError } from "@bufbuild/connect";

/**
 * @generated from rpc connectrpc.eliza.v1.Slouch.Work
 */
export const work = createQueryService({
  service: {
    methods: {
      work: {
        name: "Work",
        kind: MethodKind.Unary,
        I: Nothing,
        O: Nothing,
      },
    },
    typeName: "connectrpc.eliza.v1.Slouch",
  },
}).work;

export const useWorkQuery = (
    inputs: Parameters<typeof work.useQuery>[0],
    queryOptions?: Partial<UseBaseQueryOptions<PartialMessage<Nothing>, ConnectError>>,
    options?: Parameters<typeof work.useQuery>[1]
) => {
    const baseOptions = work.useQuery(inputs, options);

    return useQuery({
        ...baseOptions,
        ...queryOptions,
    });
};

export const useWorkMutation = (
    queryOptions?: Partial<UseMutationOptions<PartialMessage<Nothing>, ConnectError, PartialMessage<Nothing>>>,
    options?: Parameters<typeof work.useMutation>[0]
) => {
    const baseOptions = work.useMutation(options);

    return useMutation({
        ...baseOptions,
        ...queryOptions,
    });
};

export const useWorkInfiniteQuery = (
    inputs: Parameters<typeof work.useInfiniteQuery>[0],
    queryOptions?: Partial<UseInfiniteQueryOptions<PartialMessage<Nothing>, ConnectError>>,
    options?: Parameters<typeof work.useInfiniteQuery>[1]
) => {
    const baseOptions = work.useInfiniteQuery(inputs, options);

    return useInfiniteQuery({
        ...baseOptions,
        ...queryOptions,
    });
};
