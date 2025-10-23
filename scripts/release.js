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

import { execSync } from "node:child_process";
import { findWorkspaceVersion } from "./utils.js";

/*
 * Publish connect-query
 *
 * Recommended procedure:
 * 1. Trigger the prepare-release workflow with the version you want to release.
 * 2. Reviews release notes in the created PR, wait for approval.
 * 3. Merge the PR.
 */

const tag = determinePublishTag(findWorkspaceVersion("packages"));
const uncommitted = gitUncommitted();
if (uncommitted.length > 0) {
  throw new Error("Uncommitted changes found: \n" + uncommitted);
}
npmPublish();

/**
 *
 */
function npmPublish() {
  const command =
    `npm publish --tag ${tag}` +
    " --workspace packages/connect-query" +
    " --workspace packages/connect-query-core" +
    " --workspace packages/protoc-gen-connect-query";
  execSync(command, {
    stdio: "inherit",
  });
}

/**
 * @returns {string}
 */
function gitUncommitted() {
  const out = execSync("git status --short", {
    encoding: "utf-8",
  });
  if (out.trim().length === 0) {
    return "";
  }
  return out;
}

/**
 * @param {string} version
 * @returns {string}
 */
function determinePublishTag(version) {
  if (/^\d+\.\d+\.\d+$/.test(version)) {
    return "latest";
  } else if (/^\d+\.\d+\.\d+-alpha.*$/.test(version)) {
    return "alpha";
  } else if (/^\d+\.\d+\.\d+-beta.*$/.test(version)) {
    return "beta";
  } else if (/^\d+\.\d+\.\d+-rc.*$/.test(version)) {
    return "rc";
  } else {
    throw new Error(`Unable to determine publish tag from version ${version}`);
  }
}
