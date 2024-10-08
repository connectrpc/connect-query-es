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

const vitest = require("eslint-plugin-vitest");

/** @type { import('@typescript-eslint/utils/dist/index').TSESLint.Linter.Config } */
const config = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  ignorePatterns: ["node_modules/**", "packages/**/coverage"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  plugins: ["@typescript-eslint", "import", "simple-import-sort", "vitest"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/all",
    "plugin:eslint-comments/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
  ],
  settings: {
    "import/resolver": {
      typescript: {},
    },
  },
  rules: {
    ...vitest.configs.recommended.rules,
    "eslint-comments/no-unused-enable": "error",
    "eslint-comments/no-unused-disable": "error",
    "eslint-comments/no-aggregating-enable": "off",
    "eslint-comments/require-description": [
      "error",
      {
        ignore: ["eslint-enable"],
      },
    ],

    "@typescript-eslint/naming-convention": "off", // not realistic, and this exact line is a great example of why
    "@typescript-eslint/prefer-readonly-parameter-types": "off", // not realistic
    "@typescript-eslint/explicit-module-boundary-types": "off", // inference and conformance testing cover this well
    "@typescript-eslint/explicit-function-return-type": "off", // inference and conformance testing cover this well
    "@typescript-eslint/no-type-alias": "off", // this rule turns off things that are absolutely required by this project such as conditional types and literals
    "@typescript-eslint/no-throw-literal": "off", // unfortunately this rule doesn't understand returns from `unreachableCase`
    "@typescript-eslint/no-magic-numbers": "off", // literal values are used in CSS-in-JS, tests, and library constants
    "@typescript-eslint/prefer-destructuring": "off", // Added in 6.8.0, causing an issue in linting
    "@typescript-eslint/ban-ts-comment": [
      "error",
      { "ts-expect-error": { descriptionFormat: "^\\(\\d+\\) .+$" } },
    ],

    "simple-import-sort/imports": "error",
  },
  overrides: [
    {
      extends: ["plugin:@typescript-eslint/disable-type-checked"],
      files: ["**/*.js"],
      rules: {
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-var-requires": "off",
      },
    },
    {
      extends: ["plugin:@typescript-eslint/disable-type-checked"],
      files: ["**/*.d.ts"],
    },
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "vite.config.ts"],
      rules: {
        "@typescript-eslint/no-empty-function": "off", // noops are commonly needed in tests
        "@typescript-eslint/unbound-method": "off", // functors are commonly necessary for tests
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            vars: "all",
            argsIgnorePattern: "_",
          },
        ],
      },
    },
    {
      files: ["**/eliza/*", "**/gen/**", "**/snapshots/**"], // generated code
      rules: {
        "eslint-comments/no-unused-enable": "off",
        "eslint-comments/no-unused-disable": "off",
        "eslint-comments/disable-enable-pair": "off",
        "eslint-comments/no-unlimited-disable": "off",
        "eslint-comments/require-description": "off",
      },
    },
  ],
};

module.exports = config;
