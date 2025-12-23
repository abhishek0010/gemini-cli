/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { render } from '../../test-utils/render.js';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ContextSummaryDisplay } from './ContextSummaryDisplay.js';
import * as useTerminalSize from '../hooks/useTerminalSize.js';

vi.mock('../hooks/useTerminalSize.js', () => ({
  useTerminalSize: vi.fn(),
}));

const useTerminalSizeMock = vi.mocked(useTerminalSize.useTerminalSize);

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const renderWithWidth = (
  width: number,
  props: React.ComponentProps<typeof ContextSummaryDisplay>,
) => {
  useTerminalSizeMock.mockReturnValue({ columns: width, rows: 24 });
  return render(<ContextSummaryDisplay {...props} />);
};

describe('<ContextSummaryDisplay />', () => {
  const baseProps = {
    geminiMdFileCount: 0,
    contextFileNames: [],
    mcpServers: {},
    ideContext: {
      workspaceState: {
        openFiles: [],
      },
    },
  };

  it('should render on a single line on a wide screen', () => {
    const props = {
      ...baseProps,
      geminiMdFileCount: 1,
      contextFileNames: ['GEMINI.md'],
      mcpServers: { 'test-server': { command: 'test' } },
      ideContext: {
        workspaceState: {
          openFiles: [{ path: '/a/b/c', timestamp: Date.now() }],
        },
      },
    };
    const { lastFrame, unmount } = renderWithWidth(120, props);
    expect(lastFrame()).toMatchSnapshot();
    unmount();
  });

  it('should render on multiple lines on a narrow screen', () => {
    const props = {
      ...baseProps,
      geminiMdFileCount: 1,
      contextFileNames: ['GEMINI.md'],
      mcpServers: { 'test-server': { command: 'test' } },
      ideContext: {
        workspaceState: {
          openFiles: [{ path: '/a/b/c', timestamp: Date.now() }],
        },
      },
    };
    const { lastFrame, unmount } = renderWithWidth(60, props);
    expect(lastFrame()).toMatchSnapshot();
    unmount();
  });
});
