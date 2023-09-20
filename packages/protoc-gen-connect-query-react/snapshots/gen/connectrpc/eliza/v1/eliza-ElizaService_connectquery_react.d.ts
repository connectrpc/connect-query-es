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

// @generated by protoc-gen-connect-query-react v0.4.4 with parameter "target=ts+dts,import_extension=none"
// @generated from file connectrpc/eliza/v1/eliza.proto (package connectrpc.eliza.v1, syntax proto3)
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
import { MethodKind, PartialMessage } from "@bufbuild/protobuf";
import { ConnectQueryKey, UnaryFunctions } from "@connectrpc/connect-query";
import {
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { ConnectError } from "@connectrpc/connect";

/**
 * ElizaService provides a way to talk to Eliza, a port of the DOCTOR script
 * for Joseph Weizenbaum's original ELIZA program. Created in the mid-1960s at
 * the MIT Artificial Intelligence Laboratory, ELIZA demonstrates the
 * superficiality of human-computer communication. DOCTOR simulates a
 * psychotherapist, and is commonly found as an Easter egg in emacs
 * distributions.
 *
 * @generated from service connectrpc.eliza.v1.ElizaService
 */
export declare const ElizaService: {
  readonly typeName: "connectrpc.eliza.v1.ElizaService";
  readonly methods: {
    /**
     * Say is a unary RPC. Eliza responds to the prompt with a single sentence.
     *
     * @generated from rpc connectrpc.eliza.v1.ElizaService.Say
     */
    readonly say: {
      readonly name: "Say";
      readonly I: typeof SayRequest;
      readonly O: typeof SayResponse;
      readonly kind: MethodKind.Unary;
    };
    /**
     * Converse is a bidirectional RPC. The caller may exchange multiple
     * back-and-forth messages with Eliza over a long-lived connection. Eliza
     * responds to each ConverseRequest with a ConverseResponse.
     *
     * @generated from rpc connectrpc.eliza.v1.ElizaService.Converse
     */
    readonly converse: {
      readonly name: "Converse";
      readonly I: typeof ConverseRequest;
      readonly O: typeof ConverseResponse;
      readonly kind: MethodKind.BiDiStreaming;
    };
    /**
     * Introduce is a server streaming RPC. Given the caller's name, Eliza
     * returns a stream of sentences to introduce itself.
     *
     * @generated from rpc connectrpc.eliza.v1.ElizaService.Introduce
     */
    readonly introduce: {
      readonly name: "Introduce";
      readonly I: typeof IntroduceRequest;
      readonly O: typeof IntroduceResponse;
      readonly kind: MethodKind.ServerStreaming;
    };
  };
};

export const say: UnaryFunctions<SayRequest, SayResponse>;
export declare const useSayQuery: (
  input: Parameters<typeof say.createUseQueryOptions>[0],
  options?: Parameters<typeof say.createUseQueryOptions>[1],
  queryOptions?: Partial<
    UseQueryOptions<
      SayResponse,
      ConnectError,
      SayResponse,
      ConnectQueryKey<SayRequest>
    >
  >,
) => UseQueryResult<SayResponse, ConnectError>;

export declare const useSayMutation: (
  options?: Parameters<typeof say.createUseMutationOptions>[0],
  queryOptions?: Partial<
    UseMutationOptions<SayResponse, ConnectError, PartialMessage<SayRequest>>
  >,
) => UseMutationResult<
  SayResponse,
  ConnectError,
  PartialMessage<SayRequest>,
  unknown
>;

export declare const useSayInfiniteQuery: (
  input: Parameters<typeof say.createUseInfiniteQueryOptions>[0],
  options: Parameters<typeof say.createUseInfiniteQueryOptions>[1],
  queryOptions?: Partial<
    UseInfiniteQueryOptions<
      SayResponse,
      ConnectError,
      SayResponse,
      SayResponse,
      ConnectQueryKey<SayRequest>
    >
  >,
) => UseInfiniteQueryResult<SayResponse, ConnectError>;