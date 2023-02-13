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

import type { createEcmaScriptPlugin } from '@bufbuild/protoplugin';

/**
 * Extracts the type of PluginInit from @bufbuild/protoplugin
 */
export type PluginInit = Required<Parameters<typeof createEcmaScriptPlugin>[0]>;

/**
 * a list of reserved words that cannot be used as identifiers.
 */
const reservedWords = [
  'abstract',
  'as',
  'arguments',
  'await',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'double',
  'else',
  'enum',
  'eval',
  'export',
  'extends',
  'false',
  'final',
  'finally',
  'float',
  'for',
  'function',
  'goto',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'int',
  'interface',
  'let',
  'long',
  'native',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'volatile',
  'while',
  'with',
  'yield',
] as const;

type ReservedWord = (typeof reservedWords)[number];

/**
 * Predicate for indicating whether a given identifier is a reserved word in JavaScript
 */
export const isReservedWord = <T extends string>(word: ReservedWord | T): word is ReservedWord => (
  reservedWords.includes(word as ReservedWord)
);

/**
 * When JavaScript identifiers are formed from the names of Service RPCs, it is possible to hit a situation where the names collide.
 * 
 * For example, `delete` is a reserved word in JavaScript.  Therefore the input protofile:
 * ```proto
 * service MyService {
 *   rpc Delete(empty) returns (Empty)
 * }
 * ```
 * 
 * would otherwise be serialized to:
 * ```ts
 * const delete = ....
 * ```
 * 
 * which is a syntax error.
 * 
 * This function fixes that by appending `_RPC` to the end of the identifier.
 */
export const sanitizeIdentifiers = <T extends string>(word: T) => {
  if (isReservedWord(word)) {
    return `${word}_RPC` as const;
  }
  return word;
}