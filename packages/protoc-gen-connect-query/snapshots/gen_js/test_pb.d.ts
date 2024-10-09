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

// @generated by protoc-gen-es v2.2.0
// @generated from file test.proto (package test, syntax proto3)
/* eslint-disable */

import type { GenFile, GenMessage, GenService } from "@bufbuild/protobuf/codegenv1";
import type { Message } from "@bufbuild/protobuf";
import type { Int32ValueSchema, StringValueSchema } from "@bufbuild/protobuf/wkt";

/**
 * Describes the file test.proto.
 */
export declare const file_test: GenFile;

/**
 * @generated from message test.FooRequest
 */
export declare type FooRequest = Message<"test.FooRequest"> & {
  /**
   * @generated from field: int32 number = 1;
   */
  number: number;
};

/**
 * Describes the message test.FooRequest.
 * Use `create(FooRequestSchema)` to create a new message.
 */
export declare const FooRequestSchema: GenMessage<FooRequest>;

/**
 * @generated from message test.FooResponse
 */
export declare type FooResponse = Message<"test.FooResponse"> & {
  /**
   * @generated from field: string str = 1;
   */
  str: string;
};

/**
 * Describes the message test.FooResponse.
 * Use `create(FooResponseSchema)` to create a new message.
 */
export declare const FooResponseSchema: GenMessage<FooResponse>;

/**
 * @generated from service test.SnapshotService
 */
export declare const SnapshotService: GenService<{
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
}>;

/**
 * This service should be generated into a second file
 *
 * @generated from service test.SecondSnapshotService
 */
export declare const SecondSnapshotService: GenService<{
  /**
   * @generated from rpc test.SecondSnapshotService.Foo
   */
  foo: {
    methodKind: "unary";
    input: typeof FooRequestSchema;
    output: typeof FooResponseSchema;
  },
}>;

