import type { Message, MethodInfoUnary } from "@bufbuild/protobuf";

/** Defines a standalone method and associated service  */
export type MethodUnaryDescriptor<
  I extends Message<I>,
  O extends Message<O>,
> = MethodInfoUnary<I, O> & {
  localName: string;
  service: {
    typeName: string;
  };
};
