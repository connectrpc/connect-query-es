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

// @generated by protoc-gen-connect-query-react v0.0.1 with parameter "target=ts,import-hook-from=@tanstack/react-query"
// @generated from file eliza.proto (package buf.connect.demo.eliza.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { createQueryService } from "@bufbuild/connect-query";
import { MethodKind, PartialMessage } from "@bufbuild/protobuf";
import { CountRequest, CountResponse } from "./eliza_pb.js";
import { UseBaseQueryOptions, useInfiniteQuery, UseInfiniteQueryOptions, useMutation, UseMutationOptions, useQuery } from "@tanstack/react-query";
import { ConnectError } from "@bufbuild/connect";

/**
 * @generated from rpc buf.connect.demo.eliza.v1.BigIntService.Count
 */
export const count = createQueryService({
  service: {
    methods: {
      count: {
        name: "Count",
        kind: MethodKind.Unary,
        I: CountRequest,
        O: CountResponse,
      },
    },
    typeName: "buf.connect.demo.eliza.v1.BigIntService",
  },
}).count;

export const useCountQuery = (
    inputs: Parameters<typeof count.useQuery>[0],
    queryOptions?: Partial<UseBaseQueryOptions<PartialMessage<CountRequest>, ConnectError>>,
    options?: Parameters<typeof count.useQuery>[1]
) => {
    const baseOptions = count.useQuery(inputs, options);

    return useQuery({
        ...baseOptions,
        ...queryOptions,
    });
};

export const useCountMutation = (
    queryOptions?: Partial<UseMutationOptions<PartialMessage<CountResponse>, ConnectError, PartialMessage<CountRequest>>>,
    options?: Parameters<typeof count.useMutation>[0]
) => {
    const baseOptions = count.useMutation(options);

    return useMutation({
        ...baseOptions,
        ...queryOptions,
    });
};

export const useCountInfiniteQuery = (
    inputs: Parameters<typeof count.useInfiniteQuery>[0],
    queryOptions?: Partial<UseInfiniteQueryOptions<PartialMessage<CountRequest>, ConnectError>>,
    options?: Parameters<typeof count.useInfiniteQuery>[1]
) => {
    const baseOptions = count.useInfiniteQuery(inputs, options);

    return useInfiniteQuery({
        ...baseOptions,
        ...queryOptions,
    });
};
