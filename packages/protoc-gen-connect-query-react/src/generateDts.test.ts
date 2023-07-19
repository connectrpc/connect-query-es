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

import { describe, expect, it } from '@jest/globals';

import packageJson from '../package.json';
import { generate } from './jest/helpers';

describe('generateDts', () => {
  it('generates a full d.ts file', () => {
    const result = generate('dts')(
      'eliza-ElizaService_connectquery_react.d.ts',
    );
    expect(result).toStrictEqual([
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
      `// @generated by protoc-gen-connect-query-react v${packageJson.version} with parameter "target=dts"`,
      '// @generated from file eliza.proto (package buf.connect.demo.eliza.v1, syntax proto3)',
      '/* eslint-disable */',
      '// @ts-nocheck',
      '',
      'import { UnaryHooks } from "@bufbuild/connect-query";',
      'import { SayRequest, SayResponse } from "./eliza_pb.js";',
      'import { UseBaseQueryOptions, UseInfiniteQueryOptions, UseInfiniteQueryResult, UseMutationOptions, UseMutationResult, UseQueryResult } from "@tanstack/react-query";',
      'import { PartialMessage } from "@bufbuild/protobuf";',
      'import { ConnectError } from "@bufbuild/connect";',
      '',
      'export const say: UnaryHooks<SayRequest, SayResponse>;',
      'export declare const useSayQuery: (',
      '    inputs: Parameters<typeof say.useQuery>[0],',
      '    queryOptions?: Partial<UseBaseQueryOptions<PartialMessage<SayRequest>, ConnectError>>,',
      '    options?: Parameters<typeof say.useQuery>[1]',
      ') => UseQueryResult<SayResponse,ConnectError>;',
      '',
      'export const useSayMutation: (',
      '    queryOptions?: Partial<UseMutationOptions<PartialMessage<SayResponse>, ConnectError, PartialMessage<SayRequest>>>,',
      '    options?: Parameters<typeof say.useMutation>[0]',
      ') => UseMutationResult<SayResponse,ConnectError,PartialMessage<SayRequest>, unknown>;',
      '',
      'export const useSayInfiniteQuery: (',
      '    inputs: Parameters<typeof say.useInfiniteQuery>[0],',
      '    queryOptions?: Partial<UseInfiniteQueryOptions<PartialMessage<SayRequest>, ConnectError>>,',
      '    options?: Parameters<typeof say.useInfiniteQuery>[1]',
      ') => UseInfiniteQueryResult<SayResponse,ConnectError>;',
      '',
      'export const sayAgain: UnaryHooks<SayRequest, SayResponse>;',
      'export declare const useSayAgainQuery: (',
      '    inputs: Parameters<typeof sayAgain.useQuery>[0],',
      '    queryOptions?: Partial<UseBaseQueryOptions<PartialMessage<SayRequest>, ConnectError>>,',
      '    options?: Parameters<typeof sayAgain.useQuery>[1]',
      ') => UseQueryResult<SayResponse,ConnectError>;',
      '',
      'export const useSayAgainMutation: (',
      '    queryOptions?: Partial<UseMutationOptions<PartialMessage<SayResponse>, ConnectError, PartialMessage<SayRequest>>>,',
      '    options?: Parameters<typeof sayAgain.useMutation>[0]',
      ') => UseMutationResult<SayResponse,ConnectError,PartialMessage<SayRequest>, unknown>;',
      '',
      'export const useSayAgainInfiniteQuery: (',
      '    inputs: Parameters<typeof sayAgain.useInfiniteQuery>[0],',
      '    queryOptions?: Partial<UseInfiniteQueryOptions<PartialMessage<SayRequest>, ConnectError>>,',
      '    options?: Parameters<typeof sayAgain.useInfiniteQuery>[1]',
      ') => UseInfiniteQueryResult<SayResponse,ConnectError>;',
    ]);
  });

  it('generates a d.ts file with valid option', () => {
    expect(
      generate(
        'dts',
        'import-hook-from=@other/react-query',
      )(`eliza-ElizaService_connectquery_react.d.ts`).join('\n'),
    ).toContain(` from "@other/react-query";`);
  });
});
