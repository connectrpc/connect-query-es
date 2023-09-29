// Copyright 2021-2023 Buf Technologies, Inc.
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

/** @type {import('jest').Config} */
module.exports = {
  collectCoverage: true,
  coverageReporters: ["json", "lcov", "text", "clover", "text-summary"],
  coveragePathIgnorePatterns: ["src/jest", "src/gen"],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  injectGlobals: false,
  clearMocks: true,
  snapshotFormat: {
    printBasicPrototype: false,
  },
  workerThreads: true, // Enabled so jest would stop complaining about serializing BigInt.  See https://github.com/jestjs/jest/issues/11617#issuecomment-1458155552 for details
  transform: {
    "^.+\\.(ts|tsx|js)$": [
      "ts-jest",
      {
        isolatedModules: false,
        diagnostics: {
          ignoreCodes: [
            7031, // TODO: this is, for some reason, needed because of a problem with local linking and TypeScript that we haven't debugged because it won't matter by the time this PR merges because connect will have already released
            6196, // unused variables are necessary because all TypeScript type tests are technically unused (type) variables
            151001, // ts-jest[config] (WARN) message TS151001: If you have issues related to imports, you should consider setting `esModuleInterop` to `true` in your TypeScript configuration file (usually `tsconfig.json`). See https://blogs.msdn.microsoft.com/typescript/2018/01/31/announcing-typescript-2-7/#easier-ecmascript-module-interoperability for more information.
          ],
        },
      },
    ],
  },
};
