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

import type { Config } from "jest";

const config: Config = {
  preset: "../../../jest-preset.js",
  testEnvironment: "@bufbuild/jest-environment-jsdom",
  moduleNameMapper: {
    "(.+)\\.js": "$1", // https://connectrpc.com/docs/web/supported-browsers-and-frameworks/#jest
    "\\.(css|less)$": "<rootDir>/__mocks__/style.js",
  },
  testMatch: ["<rootDir>/**/*.test.ts?(x)"],
  collectCoverage: false,
  injectGlobals: true,
};

export default config;
