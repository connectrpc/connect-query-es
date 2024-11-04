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

// @generated by protoc-gen-es v2.2.1 with parameter "target=ts"
// @generated from file test.proto (package test, syntax proto3)
/* eslint-disable */

import type { GenFile, GenMessage, GenService } from "@bufbuild/protobuf/codegenv1";
import { fileDesc, messageDesc, serviceDesc } from "@bufbuild/protobuf/codegenv1";
import type { Int32ValueSchema, StringValueSchema } from "@bufbuild/protobuf/wkt";
import { file_google_protobuf_wrappers } from "@bufbuild/protobuf/wkt";
import type { Message } from "@bufbuild/protobuf";

/**
 * Describes the file test.proto.
 */
export const file_test: GenFile = /*@__PURE__*/
  fileDesc("Cgp0ZXN0LnByb3RvEgR0ZXN0IhwKCkZvb1JlcXVlc3QSDgoGbnVtYmVyGAEgASgFIhoKC0Zvb1Jlc3BvbnNlEgsKA3N0chgBIAEoCTK2AwoPU25hcHNob3RTZXJ2aWNlEioKA0ZvbxIQLnRlc3QuRm9vUmVxdWVzdBoRLnRlc3QuRm9vUmVzcG9uc2USTAoKRGVwcmVjYXRlZBIbLmdvb2dsZS5wcm90b2J1Zi5JbnQzMlZhbHVlGhwuZ29vZ2xlLnByb3RvYnVmLlN0cmluZ1ZhbHVlIgOIAgESSwoMQ2xpZW50U3RyZWFtEhsuZ29vZ2xlLnByb3RvYnVmLkludDMyVmFsdWUaHC5nb29nbGUucHJvdG9idWYuU3RyaW5nVmFsdWUoARJLCgxTZXJ2ZXJTdHJlYW0SGy5nb29nbGUucHJvdG9idWYuSW50MzJWYWx1ZRocLmdvb2dsZS5wcm90b2J1Zi5TdHJpbmdWYWx1ZTABEksKCkJpZGlTdHJlYW0SGy5nb29nbGUucHJvdG9idWYuSW50MzJWYWx1ZRocLmdvb2dsZS5wcm90b2J1Zi5TdHJpbmdWYWx1ZSgBMAESQgoFY2xhc3MSGy5nb29nbGUucHJvdG9idWYuSW50MzJWYWx1ZRocLmdvb2dsZS5wcm90b2J1Zi5TdHJpbmdWYWx1ZTJDChVTZWNvbmRTbmFwc2hvdFNlcnZpY2USKgoDRm9vEhAudGVzdC5Gb29SZXF1ZXN0GhEudGVzdC5Gb29SZXNwb25zZWIGcHJvdG8z", [file_google_protobuf_wrappers]);

/**
 * @generated from message test.FooRequest
 */
export type FooRequest = Message<"test.FooRequest"> & {
  /**
   * @generated from field: int32 number = 1;
   */
  number: number;
};

/**
 * Describes the message test.FooRequest.
 * Use `create(FooRequestSchema)` to create a new message.
 */
export const FooRequestSchema: GenMessage<FooRequest> = /*@__PURE__*/
  messageDesc(file_test, 0);

/**
 * @generated from message test.FooResponse
 */
export type FooResponse = Message<"test.FooResponse"> & {
  /**
   * @generated from field: string str = 1;
   */
  str: string;
};

/**
 * Describes the message test.FooResponse.
 * Use `create(FooResponseSchema)` to create a new message.
 */
export const FooResponseSchema: GenMessage<FooResponse> = /*@__PURE__*/
  messageDesc(file_test, 1);

/**
 * @generated from service test.SnapshotService
 */
export const SnapshotService: GenService<{
  /**
   * @generated from rpc test.SnapshotService.Foo
   */
  foo: {
    methodKind: "unary";
    input: typeof FooRequestSchema;
    output: typeof FooResponseSchema;
  },
  /**
   * This RPC is deprecated
   *
   * @generated from rpc test.SnapshotService.Deprecated
   * @deprecated
   */
  deprecated: {
    methodKind: "unary";
    input: typeof Int32ValueSchema;
    output: typeof StringValueSchema;
  },
  /**
   * This streaming RPC should not be generated
   *
   * @generated from rpc test.SnapshotService.ClientStream
   */
  clientStream: {
    methodKind: "client_streaming";
    input: typeof Int32ValueSchema;
    output: typeof StringValueSchema;
  },
  /**
   * This streaming RPC should not be generated
   *
   * @generated from rpc test.SnapshotService.ServerStream
   */
  serverStream: {
    methodKind: "server_streaming";
    input: typeof Int32ValueSchema;
    output: typeof StringValueSchema;
  },
  /**
   * This streaming RPC should not be generated
   *
   * @generated from rpc test.SnapshotService.BidiStream
   */
  bidiStream: {
    methodKind: "bidi_streaming";
    input: typeof Int32ValueSchema;
    output: typeof StringValueSchema;
  },
  /**
   * This RPC name is a reserved word in ECMAScript
   *
   * @generated from rpc test.SnapshotService.class
   */
  class: {
    methodKind: "unary";
    input: typeof Int32ValueSchema;
    output: typeof StringValueSchema;
  },
}> = /*@__PURE__*/
  serviceDesc(file_test, 0);

/**
 * This service should be generated into a second file
 *
 * @generated from service test.SecondSnapshotService
 */
export const SecondSnapshotService: GenService<{
  /**
   * @generated from rpc test.SecondSnapshotService.Foo
   */
  foo: {
    methodKind: "unary";
    input: typeof FooRequestSchema;
    output: typeof FooResponseSchema;
  },
}> = /*@__PURE__*/
  serviceDesc(file_test, 1);

