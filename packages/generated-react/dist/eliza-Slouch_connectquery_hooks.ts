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

// @generated by protoc-gen-connect-query-with-hooks v0.0.1 with parameter "target=ts,import-hook-from=@tanstack/react-query"
// @generated from file eliza.proto (package buf.connect.demo.eliza.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { work } from "./eliza-Slouch_connectquery.ts";
import { UseBaseQueryOptions, useInfiniteQuery, UseInfiniteQueryOptions, useMutation, UseMutationOptions, useQuery } from "@tanstack/react-query";
import { PartialMessage } from "@bufbuild/protobuf";
import { Nothing } from "./eliza_pb.js";
import { ConnectError } from "@bufbuild/connect";

/**
 * @generated from rpc buf.connect.demo.eliza.v1.Slouch.Work
 */
export const useWorkQuery = 
  ({
    inputs,
    transformParams,
  }: {
    inputs: Parameters<typeof work.useQuery>;
    transformParams?: (
      baseOptions: ReturnType<typeof work.useQuery>
    ) => Partial<UseBaseQueryOptions<PartialMessage<Nothing>, ConnectError>>;
  }) => {
    const baseOptions = work.useQuery(...inputs);
    let options = baseOptions;
    if (transformParams) {
      options = Object.assign({}, baseOptions, transformParams(baseOptions));
    }

    return useQuery(options);
  };

export const useWorkMutation = 
  ({
    inputs,
    transformParams,
  }: {
    inputs: Parameters<typeof work.useMutation>;
    transformParams?: (
      baseOptions: ReturnType<typeof work.useMutation>
    ) => Partial<UseMutationOptions<PartialMessage<Nothing>, ConnectError, PartialMessage<Nothing>>>;
  }) => {
    const baseOptions = work.useMutation(...inputs);
    let options = baseOptions;
    if (transformParams) {
      options = Object.assign({}, baseOptions, transformParams(baseOptions));
    }

    return useMutation(options);
  };

export const useWorkInfiniteQuery = 
  ({
    inputs,
    transformParams,
  }: {
    inputs: Parameters<typeof work.useInfiniteQuery>;
    transformParams?: (
      baseOptions: ReturnType<typeof work.useInfiniteQuery>
    ) => Partial<UseInfiniteQueryOptions<PartialMessage<Nothing>, ConnectError>>;
  }) => {
    const baseOptions = work.useInfiniteQuery(...inputs);
    let options = baseOptions;
    if (transformParams) {
      options = Object.assign({}, baseOptions, transformParams(baseOptions));
    }

    return useInfiniteQuery(options);
  };
