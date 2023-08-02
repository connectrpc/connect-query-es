// @generated by protoc-gen-connect-query v0.4.0 with parameter "target=ts"
// @generated from file example.proto (package example.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { createQueryService } from "@bufbuild/connect-query";
import { MethodIdempotency, MethodKind } from "@bufbuild/protobuf";
import { Empty, Todo, Todos } from "./example_pb.js";

export const typeName = "example.v1.TodoService";

/**
 * A helpful RPC to get all current Todos
 *
 * @generated from rpc example.v1.TodoService.GetTodos
 */
export const getTodos = createQueryService({
  service: {
    methods: {
      getTodos: {
        name: "GetTodos",
        kind: MethodKind.Unary,
        I: Empty,
        O: Todos,
        idempotency: MethodIdempotency.NoSideEffects,
      },
    },
    typeName: "example.v1.TodoService",
  },
}).getTodos;

/**
 * @generated from rpc example.v1.TodoService.AddTodo
 */
export const addTodo = createQueryService({
  service: {
    methods: {
      addTodo: {
        name: "AddTodo",
        kind: MethodKind.Unary,
        I: Todo,
        O: Todos,
      },
    },
    typeName: "example.v1.TodoService",
  },
}).addTodo;

/**
 * this RPC exists to test how JavaScript reserved keywords are translated
 *
 * @generated from rpc example.v1.TodoService.Delete
 */
export const delete$ = createQueryService({
  service: {
    methods: {
      delete: {
        name: "Delete",
        kind: MethodKind.Unary,
        I: Empty,
        O: Empty,
      },
    },
    typeName: "example.v1.TodoService",
  },
}).delete;

/**
 * this RPC exists to test how JavaScript reserved object properties are translated
 *
 * @generated from rpc example.v1.TodoService.ValueOf
 */
export const valueOf$ = createQueryService({
  service: {
    methods: {
      valueOf$: {
        name: "ValueOf",
        kind: MethodKind.Unary,
        I: Empty,
        O: Empty,
      },
    },
    typeName: "example.v1.TodoService",
  },
}).valueOf$;
