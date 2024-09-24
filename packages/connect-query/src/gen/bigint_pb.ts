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

// @generated by protoc-gen-es v2.1.0 with parameter "target=ts"
// @generated from file bigint.proto (syntax proto3)
/* eslint-disable */

import type { GenFile, GenMessage, GenService } from "@bufbuild/protobuf/codegenv1";
import { fileDesc, messageDesc, serviceDesc } from "@bufbuild/protobuf/codegenv1";
import type { EmptySchema } from "@bufbuild/protobuf/wkt";
import { file_google_protobuf_empty } from "@bufbuild/protobuf/wkt";
import type { Message } from "@bufbuild/protobuf";

/**
 * Describes the file bigint.proto.
 */
export const file_bigint: GenFile = /*@__PURE__*/
  fileDesc("CgxiaWdpbnQucHJvdG8iGwoMQ291bnRSZXF1ZXN0EgsKA2FkZBgBIAEoAyIeCg1Db3VudFJlc3BvbnNlEg0KBWNvdW50GAEgASgDMmsKDUJpZ0ludFNlcnZpY2USJgoFQ291bnQSDS5Db3VudFJlcXVlc3QaDi5Db3VudFJlc3BvbnNlEjIKCEdldENvdW50EhYuZ29vZ2xlLnByb3RvYnVmLkVtcHR5Gg4uQ291bnRSZXNwb25zZWIGcHJvdG8z", [file_google_protobuf_empty]);

/**
 * @generated from message CountRequest
 */
export type CountRequest = Message<"CountRequest"> & {
  /**
   * @generated from field: int64 add = 1;
   */
  add: bigint;
};

/**
 * Describes the message CountRequest.
 * Use `create(CountRequestSchema)` to create a new message.
 */
export const CountRequestSchema: GenMessage<CountRequest> = /*@__PURE__*/
  messageDesc(file_bigint, 0);

/**
 * @generated from message CountResponse
 */
export type CountResponse = Message<"CountResponse"> & {
  /**
   * @generated from field: int64 count = 1;
   */
  count: bigint;
};

/**
 * Describes the message CountResponse.
 * Use `create(CountResponseSchema)` to create a new message.
 */
export const CountResponseSchema: GenMessage<CountResponse> = /*@__PURE__*/
  messageDesc(file_bigint, 1);

/**
 * @generated from service BigIntService
 */
export const BigIntService: GenService<{
  /**
   * @generated from rpc BigIntService.Count
   */
  count: {
    methodKind: "unary";
    input: typeof CountRequestSchema;
    output: typeof CountResponseSchema;
  },
  /**
   * @generated from rpc BigIntService.GetCount
   */
  getCount: {
    methodKind: "unary";
    input: typeof EmptySchema;
    output: typeof CountResponseSchema;
  },
}> = /*@__PURE__*/
  serviceDesc(file_bigint, 0);
