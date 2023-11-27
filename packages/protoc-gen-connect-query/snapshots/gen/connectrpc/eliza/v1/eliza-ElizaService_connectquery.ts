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

// @generated by protoc-gen-connect-query v0.5.3 with parameter "target=ts+dts+js,import_extension=none,ts_nocheck=false"
// @generated from file connectrpc/eliza/v1/eliza.proto (package connectrpc.eliza.v1, syntax proto3)
/* eslint-disable */

import { MethodKind } from "@bufbuild/protobuf";
import { SayRequest, SayResponse } from "./eliza_pb";

/**
 * Say is a unary RPC. Eliza responds to the prompt with a single sentence.
 *
 * @generated from rpc connectrpc.eliza.v1.ElizaService.Say
 */
export const say = {
  localName: "say",
  name: "Say",
  kind: MethodKind.Unary,
  I: SayRequest,
  O: SayResponse,
  service: {
    typeName: "connectrpc.eliza.v1.ElizaService",
  },
} as const;
