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

import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { createConnectQueryClient } from "@connectrpc/connect-query-core";
import type { ConnectQueryClient } from "@connectrpc/connect-query-core";

export function useConnectQueryClient(): ConnectQueryClient {
  const queryClient = useQueryClient();
  return useMemo(() => {
    return createConnectQueryClient(queryClient);
  }, [queryClient]);
}
