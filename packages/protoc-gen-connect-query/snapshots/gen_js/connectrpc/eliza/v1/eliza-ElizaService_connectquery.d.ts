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

// @generated by protoc-gen-connect-query v1.0.0
// @generated from file connectrpc/eliza/v1/eliza.proto (package connectrpc.eliza.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { SayRequest, SayResponse } from "./eliza_pb.js";
import { MethodKind } from "@bufbuild/protobuf";

/**
 * Say is a unary RPC. Eliza responds to the prompt with a single sentence.
 *
 * @generated from rpc connectrpc.eliza.v1.ElizaService.Say
 */
export const say: {
  readonly name: "Say";
  readonly I: typeof SayRequest;
  readonly O: typeof SayResponse;
  readonly kind: MethodKind.Unary;
  readonly service: {
    readonly typeName: "connectrpc.eliza.v1.ElizaService";
  };
};
