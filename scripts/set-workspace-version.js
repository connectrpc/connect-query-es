#!/usr/bin/env node

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

// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { readFileSync, writeFileSync, existsSync, globSync } from "node:fs";
import { dirname, join } from "node:path";
import assert from "node:assert";

if (process.argv.length < 3) {
  process.stderr.write(
    [
      `USAGE: ${process.argv[1]} <new-version>`,
      "",
      "Walks through all workspace packages and sets the version of each ",
      "package to the given version.",
      "If a package depends on another package from the workspace, the",
      "dependency version is updated as well.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

try {
  const newVersion = process.argv[2];
  const lockFile = "package-lock.json";
  const workspaces = findWorkspacePackages("package.json");
  const lock = tryReadLock(lockFile);
  const updates = setVersion(workspaces, lock, newVersion);
  if (updates.length > 0) {
    for (const { path, pkg } of workspaces) {
      writeJson(path, pkg);
    }
    if (lock) {
      writeJson(lockFile, lock);
    }
    process.stdout.write(formatUpdates(updates) + "\n");
  }
} catch (e) {
  process.stderr.write(String(e) + "\n");
  process.exit(1);
}

/**
 * @typedef {{path: string; pkg: Package}} Workspace
 * @typedef {{name: string; version?: string}} Package
 * @typedef {{packages: Record<string, {name?: name; version?: string}>}} Lockfile
 * @typedef {{message: string, pkg: Package}} Update
 */

/**
 * @param {Workspace[]} workspaces
 * @param {Lockfile | null} lock
 * @param {string} newVersion
 * @return {Update[]}
 */
function setVersion(workspaces, lock, newVersion) {
  const updates = [];
  for (const { pkg } of workspaces) {
    if (typeof pkg.version !== "string") {
      continue;
    }
    assert(pkg.name, "Missing package name");
    if (pkg.version === newVersion) {
      continue;
    }
    pkg.version = newVersion;
    if (lock) {
      const l = Object.entries(lock.packages).find(([path, l]) => {
        if ("name" in l) {
          return l.name === pkg.name;
        }
        // In some situations, the entry for a local package doesn't have a "name" property.
        // We check the path of the entry instead: If the last path element is the same as
        // the package name without scope, it's the entry we are looking for.
        return (
          !path.startsWith("node_modules/") &&
          path.split("/").pop() === pkg.name.split("/").pop()
        );
      })?.[1];
      assert(l, `Cannot find lock entry for ${pkg.name} and it is not private`);
      l.version = newVersion;
    }
    updates.push({
      pkg,
      message: `updated version from ${pkg.version} to ${newVersion}`,
    });
  }
  const pkgs = workspaces.map(({ pkg }) => pkg);
  updates.push(...syncDeps(pkgs, pkgs));
  if (lock) {
    syncDeps(Object.values(lock.packages), pkgs);
  }
  return updates;
}

/**
 * @param {Record<string, unknown>} packages
 * @param {Package[]} deps
 * @return {Update[]}
 */
function syncDeps(packages, deps) {
  const updates = [];
  for (const pkg of packages) {
    for (const key of [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ]) {
      if (!Object.prototype.hasOwnProperty.call(pkg, key)) {
        continue;
      }
      for (const [name, version] of Object.entries(pkg[key])) {
        const dep = deps.find((x) => x.name === name);
        if (!dep) {
          continue;
        }
        let wantVersion = dep.version;
        if (version.startsWith("^")) {
          wantVersion = "^" + wantVersion;
        } else if (version.startsWith("~")) {
          wantVersion = "~" + wantVersion;
        } else if (version.startsWith("=")) {
          wantVersion = "=" + wantVersion;
        } else if (version === "*") {
          wantVersion = "*";
        }
        if (wantVersion === version) {
          continue;
        }
        pkg[key][name] = wantVersion;
        updates.push({
          pkg,
          message: `updated ${key}["${name}"] from ${version} to ${wantVersion}`,
        });
      }
    }
  }
  return updates;
}

/**
 * Read the given root package.json file, and return an array of workspace
 * packages.
 *
 * @param {string} rootPackageJsonPath
 * @return {Workspace[]}
 */
function findWorkspacePackages(rootPackageJsonPath) {
  const root = JSON.parse(readFileSync(rootPackageJsonPath, "utf-8"));
  if (
    !Array.isArray(root.workspaces) ||
    root.workspaces.some((w) => typeof w !== "string")
  ) {
    throw new Error(
      `Missing or malformed "workspaces" array in ${rootPackageJsonPath}`,
    );
  }
  const rootDir = dirname(rootPackageJsonPath);
  return root.workspaces
    .flatMap((ws) => globSync(join(rootDir, ws, "package.json")))
    .filter((path) => existsSync(path))
    .map((path) => {
      const pkg = JSON.parse(readFileSync(path, "utf-8"));
      return { path, pkg };
    });
}

/**
 * @param {string} path
 * @param {Record<unknown, unknown>} json
 */
function writeJson(path, json) {
  writeFileSync(path, JSON.stringify(json, null, 2) + "\n");
}

/**
 *
 * @param {Update[]} updates
 * @return {string}
 */
function formatUpdates(updates) {
  const lines = [];
  const updatesByName = {};
  for (const update of updates) {
    if (updatesByName[update.pkg.name] === undefined) {
      updatesByName[update.pkg.name] = [];
    }
    updatesByName[update.pkg.name].push(update);
  }
  for (const name of Object.keys(updatesByName).sort()) {
    lines.push(`${name}:`);
    for (const update of updatesByName[name]) {
      lines.push(`  ${update.message}`);
    }
  }
  return lines.join("\n");
}

/**
 * @param {string} lockFile
 * @return {Lockfile | null}
 */
function tryReadLock(lockFile) {
  if (!existsSync(lockFile)) {
    return null;
  }
  const lock = JSON.parse(readFileSync(lockFile, "utf-8"));
  assert(lock.lockfileVersion === 3);
  assert(typeof lock.packages == "object");
  assert(lock.packages !== null);
  return lock;
}
