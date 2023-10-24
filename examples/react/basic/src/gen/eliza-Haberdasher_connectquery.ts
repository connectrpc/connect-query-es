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

// @generated by protoc-gen-connect-query v0.6.0 with parameter "target=ts,import_extension=none,ts_nocheck=false"
// @generated from file eliza.proto (package connectrpc.eliza.v1, syntax proto3)
/* eslint-disable */

import { Nothing } from "./eliza_pb";
import { MethodKind } from "@bufbuild/protobuf";
import {
  createQueryService,
  createUnaryHooks,
  UnaryFunctionsWithHooks,
} from "@connectrpc/connect-query";

export const typeName = "connectrpc.eliza.v1.Haberdasher";

/**
 * @generated from service connectrpc.eliza.v1.Haberdasher
 */
export const Haberdasher = {
  typeName: "connectrpc.eliza.v1.Haberdasher",
  methods: {
    /**
     * @generated from rpc connectrpc.eliza.v1.Haberdasher.Work
     */
    work: {
      name: "Work",
      I: Nothing,
      O: Nothing,
      kind: MethodKind.Unary,
    },
  },
} as const;

const $queryService = createQueryService({ service: Haberdasher });

/**
 * @generated from rpc connectrpc.eliza.v1.Haberdasher.Work
 */
export const work: UnaryFunctionsWithHooks<Nothing, Nothing> = {
  ...$queryService.work,
  ...createUnaryHooks($queryService.work),
};
