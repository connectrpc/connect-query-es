// Copyright 2021-2022 Buf Technologies, Inc.
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

import type { Target } from '@bufbuild/protoplugin/ecmascript';
import { describe, expect, it } from '@jest/globals';

import packageJson from '../package.json';
import { generate } from './jest/helpers';

describe('generateTs', () => {
  const expected = (target: Target) => [
    '// Copyright 2021-2022 Buf Technologies, Inc.',
    '//',
    '// Licensed under the Apache License, Version 2.0 (the "License");',
    '// you may not use this file except in compliance with the License.',
    '// You may obtain a copy of the License at',
    '//',
    '//      http://www.apache.org/licenses/LICENSE-2.0',
    '//',
    '// Unless required by applicable law or agreed to in writing, software',
    '// distributed under the License is distributed on an "AS IS" BASIS,',
    '// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.',
    '// See the License for the specific language governing permissions and',
    '// limitations under the License.',
    '',
    `// @generated by protoc-gen-connect-query-with-hooks v${packageJson.version} with parameter "target=${target},import-hook-from=@tanstack/react-query"`,
    '// @generated from file eliza.proto (package buf.connect.demo.eliza.v1, syntax proto3)',
    '/* eslint-disable */',
    '// @ts-nocheck',
    '',
    'import { createQueryService } from "@bufbuild/connect-query";',
    'import { MethodKind, PartialMessage } from "@bufbuild/protobuf";',
    'import { SayRequest, SayResponse } from "./eliza_pb.js";',
    'import { UseBaseQueryOptions, useInfiniteQuery, UseInfiniteQueryOptions, useMutation, UseMutationOptions, useQuery } from "@tanstack/react-query";',
    'import { ConnectError } from "@bufbuild/connect";',
    '',
    '/**',
    ' * Say is a unary request demo. This method should allow for a one sentence',
    ' * response given a one sentence request.',
    ' *',
    ' * @generated from rpc buf.connect.demo.eliza.v1.ElizaService.Say',
    ' */',
    'export const say = createQueryService({',
    '  service: {',
    '    methods: {',
    '      say: {',
    '        name: "Say",',
    '        kind: MethodKind.Unary,',
    '        I: SayRequest,',
    '        O: SayResponse,',
    '      },',
    '    },',
    '    typeName: "buf.connect.demo.eliza.v1.ElizaService",',
    '  },',
    '}).say;',
    '',
    'export const useSayQuery = ',
    '  (',
    '    inputs: Parameters<typeof say.useQuery>[0],',
    '    options: Parameters<typeof say.useQuery>[1],',
    '    queryOptions?: Partial<UseBaseQueryOptions<PartialMessage<SayRequest>, ConnectError>>',
    '  ) => {',
    '    const baseOptions = say.useQuery(inputs, options);',
    '',
    '    return useQuery({',
    '      ...baseOptions,',
    '      ...queryOptions,',
    '    });',
    '  };',
    '',
    'export const useSayMutation = ',
    '  (',
    '    options: Parameters<typeof say.useMutation>[0],',
    '    queryOptions?: Partial<UseMutationOptions<PartialMessage<SayResponse>, ConnectError, PartialMessage<SayRequest>>>',
    '  ) => {',
    '    const baseOptions = say.useMutation(options);',
    '',
    '    return useMutation({',
    '      ...baseOptions,',
    '      ...queryOptions,',
    '    });',
    '  };',
    '',
    'export const useSayInfiniteQuery = ',
    '  (',
    '    inputs: Parameters<typeof say.useInfiniteQuery>[0],',
    '    options: Parameters<typeof say.useInfiniteQuery>[1],',
    '    queryOptions?: Partial<UseInfiniteQueryOptions<PartialMessage<SayRequest>, ConnectError>>',
    '  ) => {',
    '    const baseOptions = say.useInfiniteQuery(inputs, options);',
    '',
    '    return useInfiniteQuery({',
    '      ...baseOptions,',
    '      ...queryOptions,',
    '    });',
    '  };',
    '',
    '/**',
    ' * Say is a unary request demo. This method should allow for a one sentence',
    ' * response given a one sentence request.',
    ' *',
    ' * @generated from rpc buf.connect.demo.eliza.v1.ElizaService.SayAgain',
    ' */',
    'export const sayAgain = createQueryService({',
    '  service: {',
    '    methods: {',
    '      sayAgain: {',
    '        name: "SayAgain",',
    '        kind: MethodKind.Unary,',
    '        I: SayRequest,',
    '        O: SayResponse,',
    '      },',
    '    },',
    '    typeName: "buf.connect.demo.eliza.v1.ElizaService",',
    '  },',
    '}).sayAgain;',
    '',
    'export const useSayAgainQuery = ',
    '  (',
    '    inputs: Parameters<typeof sayAgain.useQuery>[0],',
    '    options: Parameters<typeof sayAgain.useQuery>[1],',
    '    queryOptions?: Partial<UseBaseQueryOptions<PartialMessage<SayRequest>, ConnectError>>',
    '  ) => {',
    '    const baseOptions = sayAgain.useQuery(inputs, options);',
    '',
    '    return useQuery({',
    '      ...baseOptions,',
    '      ...queryOptions,',
    '    });',
    '  };',
    '',
    'export const useSayAgainMutation = ',
    '  (',
    '    options: Parameters<typeof sayAgain.useMutation>[0],',
    '    queryOptions?: Partial<UseMutationOptions<PartialMessage<SayResponse>, ConnectError, PartialMessage<SayRequest>>>',
    '  ) => {',
    '    const baseOptions = sayAgain.useMutation(options);',
    '',
    '    return useMutation({',
    '      ...baseOptions,',
    '      ...queryOptions,',
    '    });',
    '  };',
    '',
    'export const useSayAgainInfiniteQuery = ',
    '  (',
    '    inputs: Parameters<typeof sayAgain.useInfiniteQuery>[0],',
    '    options: Parameters<typeof sayAgain.useInfiniteQuery>[1],',
    '    queryOptions?: Partial<UseInfiniteQueryOptions<PartialMessage<SayRequest>, ConnectError>>',
    '  ) => {',
    '    const baseOptions = sayAgain.useInfiniteQuery(inputs, options);',
    '',
    '    return useInfiniteQuery({',
    '      ...baseOptions,',
    '      ...queryOptions,',
    '    });',
    '  };',
  ];

  it('generates a full ts file', () => {
    const target = 'ts';
    const output = generate(
      target,
      '@tanstack/react-query',
    )(`eliza-ElizaService_connectquery_hooks.${target}`);
    expect(output).toStrictEqual(expected(target));
  });
});
