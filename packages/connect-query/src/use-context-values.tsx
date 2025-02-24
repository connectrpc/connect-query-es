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

import { createContextValues, type ContextKey } from "@connectrpc/connect";
import type { SerializableContextValues } from "@connectrpc/connect-query-core";
import {  useMemo } from "react";

interface SerializableContextValuesWithTrackedKeys extends SerializableContextValues {
    trackedKeys: Set<ContextKey<unknown>>;
}

export function useContextValues(trackedKeys: ContextKey<unknown>[]): SerializableContextValuesWithTrackedKeys {
  const values = useMemo(() => {
    return createContextValues();
  }, []);

  const keyValue = useMemo(() => {
    const str = JSON.stringify(
      Array.from(trackedKeys).map((key) => [key.id.toString(), values.get(key)])
    );
    return str;
  }, [trackedKeys, values]);

  return useMemo(
    () => ({
      delete<T>(key: ContextKey<T>) {
        values.delete(key);
        return this;
      },
      get<T>(key: ContextKey<T>): T {
        return values.get(key);
      },
      set<T>(key: ContextKey<T>, value: T) {
        values.set(key, value);
        return this;
      },
      toString() {
        return keyValue;
      },
      trackedKeys: new Set(trackedKeys),
    }),
    [keyValue, values, trackedKeys]
  );
}

/**
 * Enforces a context value. Note that that 
 */
export function useContextValue<T>(contextValues: SerializableContextValuesWithTrackedKeys, key: ContextKey<T>, value: T): SerializableContextValuesWithTrackedKeys {
    return useMemo(() => {

        contextValues.set(key, value);
        return {
            ...contextValues,
            trackedKeys: new Set([...contextValues.trackedKeys, key]),
            toString() {
                return JSON.stringify(
                    Array.from(contextValues.trackedKeys).map((key) => [key.id.toString(), contextValues.get(key)])
                );
            }
        };
    }, [contextValues, key, value]);
}