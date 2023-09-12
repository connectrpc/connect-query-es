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

// @generated by protoc-gen-connect-query v0.4.4 with parameter "target=ts,import_extension=none"
// @generated from file eliza.proto (package connectrpc.eliza.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import {
  ConverseRequest,
  ConverseResponse,
  IntroduceRequest,
  IntroduceResponse,
  SayRequest,
  SayResponse,
} from "./eliza_pb";
import { MethodKind } from "@bufbuild/protobuf";
import { createHooks, createQueryService } from "@connectrpc/connect-query";

export const typeName = "connectrpc.eliza.v1.SecondService";

/**
 * Second Service just to make sure multiple file generation works
 *
 * @generated from service connectrpc.eliza.v1.SecondService
 */
export const SecondService = {
  typeName: "connectrpc.eliza.v1.SecondService",
  methods: {
    /**
     * Say is a unary RPC. Eliza responds to the prompt with a single sentence.
     *
     * @generated from rpc connectrpc.eliza.v1.SecondService.Say
     */
    say: {
      name: "Say",
      I: SayRequest,
      O: SayResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Converse is a bidirectional RPC. The caller may exchange multiple
     * back-and-forth messages with Eliza over a long-lived connection. Eliza
     * responds to each ConverseRequest with a ConverseResponse.
     *
     * @generated from rpc connectrpc.eliza.v1.SecondService.Converse
     */
    converse: {
      name: "Converse",
      I: ConverseRequest,
      O: ConverseResponse,
      kind: MethodKind.BiDiStreaming,
    },
    /**
     * Introduce is a server streaming RPC. Given the caller's name, Eliza
     * returns a stream of sentences to introduce itself.
     *
     * @generated from rpc connectrpc.eliza.v1.SecondService.Introduce
     */
    introduce: {
      name: "Introduce",
      I: IntroduceRequest,
      O: IntroduceResponse,
      kind: MethodKind.ServerStreaming,
    },
  },
} as const;

const queryService = createQueryService({ service: SecondService });

/**
 * Say is a unary RPC. Eliza responds to the prompt with a single sentence.
 *
 * @generated from rpc connectrpc.eliza.v1.SecondService.Say
 */
export const say = { ...queryService.say, ...createHooks(queryService.say) };
