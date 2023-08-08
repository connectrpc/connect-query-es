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

import { TestEnvironment } from 'jest-environment-jsdom';
import { TextDecoder, TextEncoder } from 'util';

// This test environment is needed because, as of 0.8.1, the Connect-ES codebase will not work in the jsdom environment due to a lack of TextEncoder and Text Decoder
class CustomJsdomEnvironment extends TestEnvironment {
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility -- it works and I'm not playing with it.
  async setup() {
    await super.setup();

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions,@typescript-eslint/no-unnecessary-condition -- it works and I'm not playing with it.  Here we hit a collision between the node and browser APIs.
    if (!this.global.TextEncoder) {
      this.global.TextEncoder = TextEncoder;
    } else {
      throw new Error(`Unnecessary polyfill "TextEncoder"`);
    }

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions,@typescript-eslint/no-unnecessary-condition -- it works and I'm not playing with it.  Here we hit a collision between the node and browser APIs.
    if (!this.global.TextDecoder) {
      this.global.TextDecoder = TextDecoder;
    } else {
      throw new Error(`Unnecessary polyfill "TextDecoder"`);
    }
  }
}

export default CustomJsdomEnvironment;
