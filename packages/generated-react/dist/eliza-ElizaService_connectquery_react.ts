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

// @generated by protoc-gen-connect-query-react v0.0.2 with parameter "target=ts,import-hook-from=@tanstack/react-query"
// @generated from file eliza.proto (package connectrpc.eliza.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { createQueryService } from "@bufbuild/connect-query";
import { MethodKind, PartialMessage } from "@bufbuild/protobuf";
import { SayRequest, SayResponse } from "./eliza_pb.js";
import { UseBaseQueryOptions, useInfiniteQuery, UseInfiniteQueryOptions, useMutation, UseMutationOptions, useQuery } from "@tanstack/react-query";
import { ConnectError } from "@bufbuild/connect";

/**
 * Say is a unary RPC. Eliza responds to the prompt with a single sentence.
 *
 * @generated from rpc connectrpc.eliza.v1.ElizaService.Say
 */
export const say = createQueryService({
  service: {
    methods: {
      say: {
        name: "Say",
        kind: MethodKind.Unary,
        I: SayRequest,
        O: SayResponse,
      },
    },
    typeName: "connectrpc.eliza.v1.ElizaService",
  },
}).say;

export const useSayQuery = (
    inputs: Parameters<typeof say.useQuery>[0],
    queryOptions?: Partial<UseBaseQueryOptions<PartialMessage<SayRequest>, ConnectError>>,
    options?: Parameters<typeof say.useQuery>[1]
) => {
    const baseOptions = say.useQuery(inputs, options);

    return useQuery({
        ...baseOptions,
        ...queryOptions,
    });
};

export const useSayMutation = (
    queryOptions?: Partial<UseMutationOptions<PartialMessage<SayResponse>, ConnectError, PartialMessage<SayRequest>>>,
    options?: Parameters<typeof say.useMutation>[0]
) => {
    const baseOptions = say.useMutation(options);

    return useMutation({
        ...baseOptions,
        ...queryOptions,
    });
};

export const useSayInfiniteQuery = (
    inputs: Parameters<typeof say.useInfiniteQuery>[0],
    queryOptions?: Partial<UseInfiniteQueryOptions<PartialMessage<SayRequest>, ConnectError>>,
    options?: Parameters<typeof say.useInfiniteQuery>[1]
) => {
    const baseOptions = say.useInfiniteQuery(inputs, options);

    return useInfiniteQuery({
        ...baseOptions,
        ...queryOptions,
    });
};
