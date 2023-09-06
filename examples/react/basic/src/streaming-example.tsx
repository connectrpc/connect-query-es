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

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { introduce } from 'generated-react/dist/eliza-ElizaService_connectquery';
import {
  list,
  streamingList,
} from 'generated-react/dist/eliza-PaginatedService_connectquery';
import { Fragment, useState } from 'react';

import { mockPaginatedTransport } from '../../../../packages/connect-query/src/jest/test-utils';

const mockPaginatedT = mockPaginatedTransport();

/**
 * Streaming example
 */
export const StreamingExample = () => {
  const [name, setName] = useState('placeholder');
  const [submittedName, setSubmittedName] = useState(name);

  const queryAgg = useQuery({
    ...introduce.useQuery({
      name: submittedName,
    }),
    refetchOnWindowFocus: false,
  });

  const paginated = useInfiniteQuery({
    ...list.useInfiniteQuery(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.page + 1n,
        pageParamKey: 'page',
        transport: mockPaginatedT,
      },
    ),
  });

  const streamPaginated = useInfiniteQuery({
    ...streamingList.useInfiniteQuery(
      {},
      {
        getNextPageParam: (lastPage) => {
          return lastPage.responses[0].page + 1n;
        },
        pageParamKey: 'page',
        transport: mockPaginatedT,
      },
    ),
  });

  return (
    <div>
      <h1>Streaming Example</h1>
      <input
        placeholder="Name"
        onChange={(e) => {
          setName(e.target.value);
        }}
      />
      <button
        onClick={() => {
          setSubmittedName(name);
        }}
      >
        Submit
      </button>
      <p>Query aggregate data: {JSON.stringify(queryAgg.data ?? {})}</p>
      <div
        style={{
          display: 'flex',
        }}
      >
        <ol>
          {paginated.data?.pages.map((page, index) => (
            <Fragment key={index}>
              {page.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </Fragment>
          ))}
          {(paginated.hasNextPage ?? false) && (
            <button
              onClick={() => {
                void paginated.fetchNextPage();
              }}
            >
              show more
            </button>
          )}
        </ol>
        <ol>
          {streamPaginated.data?.pages.map((page, index) => (
            <Fragment key={index}>
              Done: {page.done.toString()}
              {page.responses
                .flatMap((item) => item.items)
                .map((item) => (
                  <li key={item}>{item}</li>
                ))}
            </Fragment>
          ))}
          {(streamPaginated.hasNextPage ?? false) && (
            <button
              onClick={() => {
                void streamPaginated.fetchNextPage();
              }}
            >
              show more
            </button>
          )}
        </ol>
      </div>
    </div>
  );
};
