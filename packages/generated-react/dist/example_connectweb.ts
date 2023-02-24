// @generated by protoc-gen-connect-web v0.8.0 with parameter "target=ts,import_extension=.js"
// @generated from file example.proto (package buf.connect.demo.example.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { Empty, Todo, Todos } from "./example_pb.js";
import { MethodKind } from "@bufbuild/protobuf";

/**
 * @generated from service buf.connect.demo.example.v1.TodoService
 */
export const TodoService = {
  typeName: "buf.connect.demo.example.v1.TodoService",
  methods: {
    /**
     * A helpful RPC to get all current Todos
     *
     * @generated from rpc buf.connect.demo.example.v1.TodoService.GetTodos
     */
    getTodos: {
      name: "GetTodos",
      I: Empty,
      O: Todos,
      kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc buf.connect.demo.example.v1.TodoService.AddTodo
     */
    addTodo: {
      name: "AddTodo",
      I: Todo,
      O: Todos,
      kind: MethodKind.Unary,
    },
  }
} as const;

