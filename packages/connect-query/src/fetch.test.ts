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

import { beforeAll, describe, expect, it } from '@jest/globals';
import { unaryFetch } from './fetch';
import type { Equal, Expect } from './jest/test-utils';
import { hardcodedResponse, patchGlobalThisFetch } from './jest/test-utils';
import { ElizaService } from './jest/mock-data/eliza/eliza_connectweb';
import type { SayResponse } from './jest/mock-data/eliza/eliza_pb';
import { SayRequest } from './jest/mock-data/eliza/eliza_pb';
import { createConnectTransport } from '@bufbuild/connect-web';

describe('unaryFetch', () => {
  beforeAll(() => {
    patchGlobalThisFetch(hardcodedResponse);
  });

  const transport = createConnectTransport({
    baseUrl: '',
  });

  const fetchOptions = {
    input: new SayRequest(),
    methodInfo: ElizaService.methods.say,
    transport,
    typeName: ElizaService.typeName,
  }; // satisfies Parameters<typeof unaryFetch>[0];

  it('has the correct return type', () => {
    expect.assertions(0);
    const promise = unaryFetch(fetchOptions);
    type typePromise = Expect<Equal<typeof promise, Promise<SayResponse>>>;
  });

  it('returns a message', async () => {
    const response = await unaryFetch(fetchOptions);
    expect(response.toJSON()).toStrictEqual(hardcodedResponse);
  });

  it('can handle empty inputs', async () => {
    const response = await unaryFetch({
      ...fetchOptions,
      input: undefined,
    });
    expect(response.toJSON()).toStrictEqual(hardcodedResponse);
  });

  it('is aware of AbortSignal signals', () => {
    const callOptions = new AbortController();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- it is not necessary to await this promise
    unaryFetch({
      ...fetchOptions,
      callOptions,
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('eliza'),
      expect.objectContaining({
        signal: callOptions.signal,
      }),
    );
  });
});
