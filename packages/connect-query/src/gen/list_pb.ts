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
// @generated from file list.proto (syntax proto3)
/* eslint-disable */

import type { GenFile, GenMessage, GenService } from "@bufbuild/protobuf/codegenv1";
import { fileDesc, messageDesc, serviceDesc } from "@bufbuild/protobuf/codegenv1";
import type { Message } from "@bufbuild/protobuf";

/**
 * Describes the file list.proto.
 */
export const file_list: GenFile = /*@__PURE__*/
  fileDesc("CgpsaXN0LnByb3RvIhsKC0xpc3RSZXF1ZXN0EgwKBHBhZ2UYASABKAMiKwoMTGlzdFJlc3BvbnNlEgwKBHBhZ2UYASABKAMSDQoFaXRlbXMYAiADKAkyMgoLTGlzdFNlcnZpY2USIwoETGlzdBIMLkxpc3RSZXF1ZXN0Gg0uTGlzdFJlc3BvbnNlYgZwcm90bzM");

/**
 * @generated from message ListRequest
 */
export type ListRequest = Message<"ListRequest"> & {
  /**
   * @generated from field: int64 page = 1;
   */
  page: bigint;
};

/**
 * Describes the message ListRequest.
 * Use `create(ListRequestSchema)` to create a new message.
 */
export const ListRequestSchema: GenMessage<ListRequest> = /*@__PURE__*/
  messageDesc(file_list, 0);

/**
 * @generated from message ListResponse
 */
export type ListResponse = Message<"ListResponse"> & {
  /**
   * @generated from field: int64 page = 1;
   */
  page: bigint;

  /**
   * @generated from field: repeated string items = 2;
   */
  items: string[];
};

/**
 * Describes the message ListResponse.
 * Use `create(ListResponseSchema)` to create a new message.
 */
export const ListResponseSchema: GenMessage<ListResponse> = /*@__PURE__*/
  messageDesc(file_list, 1);

/**
 * @generated from service ListService
 */
export const ListService: GenService<{
  /**
   * @generated from rpc ListService.List
   */
  list: {
    methodKind: "unary";
    input: typeof ListRequestSchema;
    output: typeof ListResponseSchema;
  },
}> = /*@__PURE__*/
  serviceDesc(file_list, 0);
