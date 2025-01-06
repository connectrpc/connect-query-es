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

import type { FC, PropsWithChildren } from "react";

import { margin } from "./css";

/**
 * The wrapper for the whole page
 */
export const Page: FC<PropsWithChildren> = ({ children }) => (
  <div
    style={{
      margin: margin * 3,
      maxWidth: 800,
      display: "flex",
    }}
  >
    {children}
  </div>
);
