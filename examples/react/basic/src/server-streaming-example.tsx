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

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Data, Datum } from "./datum";
import { introduce } from "./gen/eliza-ElizaService_connectquery";
import { Indicator, Indicators } from "./indicator";
import { Page } from "./page";

/**
 * Server streaming example
 */
export const ServerStreaming = () => {
  const queryClient = useQueryClient();
  const { status, fetchStatus, data, error, refetch } = useQuery(
    introduce.useQuery(
      {
        name: "Ed",
      },
      {},
    ),
  );

  return (
    <Page>
      Status: {status}
      <Indicators label="queryStatus">
        <Indicator label="loading" parent={status} />
        <Indicator label="success" parent={status} />
        <Indicator label="error" parent={status} />
      </Indicators>
      <Indicators label="fetchStatus">
        <Indicator label="fetching" parent={fetchStatus} />
        <Indicator label="idle" parent={fetchStatus} />
        <Indicator label="paused" parent={fetchStatus} />
      </Indicators>
      <Data>
        <Datum
          label="data"
          datum={
            <ol>
              {data?.map((datum, index) => (
                <li key={index}>{datum.sentence}</li>
              ))}
            </ol>
          }
        />
        <Datum label="error" datum={JSON.stringify(error)} />
      </Data>
      <div className="box column" style={{ gap: "1rem" }}>
        <button
          onClick={() => {
            void refetch();
          }}
        >
          Refetch
        </button>
        <button
          onClick={() => {
            void queryClient.invalidateQueries(introduce.getPartialQueryKey());
          }}
        >
          Invalidate
        </button>
      </div>
    </Page>
  );
};
