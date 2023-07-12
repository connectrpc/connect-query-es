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

import { work } from "./eliza-Haberdasher_connectquery.ts";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

/**
 * @generated from rpc buf.connect.demo.eliza.v1.Haberdasher.Work
 */
export const useWorkQuery = 
  (...inputs: Parameters<typeof work.useQuery>) => useQuery(work.useQuery(inputs));

export const useWorkMutation = 
  (...inputs: Parameters<typeof work.useMutation>) => useMutation(work.useMutation(inputs));

export const useWorkInfiniteQuery = 
  (...inputs: Parameters<typeof work.useInfiniteQuery>) => useInfiniteQuery(work.useInfiniteQuery(inputs));
