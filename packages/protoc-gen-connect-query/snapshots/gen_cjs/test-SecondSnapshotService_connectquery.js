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

// @generated by protoc-gen-connect-query v2.0.0 with parameter "js_import_style=legacy_commonjs,import_extension=js"
// @generated from file test.proto (package test, syntax proto3)
/* eslint-disable */

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const { SecondSnapshotService } = require("./test_pb.js");

/**
 * @generated from rpc test.SecondSnapshotService.Foo
 */
const foo = SecondSnapshotService.method.foo;

exports.foo = foo;
