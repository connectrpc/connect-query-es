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

import '@testing-library/jest-dom';

import { createRouterTransport } from '@connectrpc/connect';
import { render, screen } from '@testing-library/react';
import { ElizaService } from 'generated-react/dist/eliza_connect';

import Main from './main';

describe('Applcation', () => {
  it('should show success status and response data', async () => {
    const transport = createRouterTransport(({ service }) => {
      service(ElizaService, {
        say: () => ({
          sentence: 'Hello, world!',
        }),
      });
    });
    render(<Main transport={transport} />);
    const text = await screen.findByText('Status: success');
    expect(text).toBeInTheDocument();
    const response = await screen.findByLabelText('data');
    expect(response).toHaveTextContent('{"sentence":"Hello, world!"}');
  });
});
