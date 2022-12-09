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

import { FileDescriptorSet } from "@bufbuild/protobuf";
import { CodeGeneratorRequest } from "@bufbuild/protobuf";
import { createEcmaScriptPlugin } from "@bufbuild/protoplugin";
import { generateDts } from "../generateDts";
import { generateTs } from "../generateTs";
import { readFileSync } from "fs";
import { resolve, join } from "path";
import type { Target } from "@bufbuild/protoplugin/ecmascript";

/**
 * Returns a FileDescriptorSet from a pre-built Buf image
 */
const getFileDescriptorSet = () => {
  const buffer = readFileSync(resolve(join(__dirname, "./descriptorset.bin")));
  return FileDescriptorSet.fromBinary(buffer);
};

/**
 * Creates a plugin with the given function to generate TypeScript,
 * runs the plugin, and returns a function to retrieve output files.
 */
export const transpile = (target: Target) => (filename: string) => {
  const codeGeneratorRequest = new CodeGeneratorRequest({
    parameter: `target=${target}`,
    fileToGenerate: ["proto/eliza.proto"],
    protoFile: getFileDescriptorSet().file,
  });

  const plugin = createEcmaScriptPlugin({
    name: "test-plugin",
    version: "v0.0.1337",
    generateTs,
    generateDts,
    generateJs: generateTs,
  });

  const codeGeneratorResponse = plugin.run(codeGeneratorRequest);

  const matchingFile = codeGeneratorResponse.file.find(
    (file) => file.name === filename
  );

  if (!matchingFile) {
    throw new Error(
      `did not find file ${filename} in ${JSON.stringify(
        codeGeneratorResponse.file
      )}`
    );
  }

  const content = matchingFile.content ?? "";
  return content.trim().split("\n");
};
