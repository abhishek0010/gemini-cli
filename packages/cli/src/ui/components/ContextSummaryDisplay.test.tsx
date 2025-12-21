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
import stripAnsi from 'strip-ansi';

vi.mock('../hooks/useTerminalSize.js', () => ({
  useTerminalSize: vi.fn(),
}));

const useTerminalSizeMock = vi.mocked(useTerminalSize.useTerminalSize);

afterEach(() => {
  vi.restoreAllMocks();
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
    const output = lastFrame()!;
    expect(output).toContain(
      'Using: 1 open file (ctrl+g to view) | 1 GEMINI.md file | 1 MCP server',
    );
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
    const output = lastFrame()!;
    expect(output).toContain('Using:');
    expect(output).toContain('- 1 open file');
    unmount();
  });

  describe('activeHooks rendering', () => {
    it('should render a single executing hook', () => {
      const props = {
        ...baseProps,
        activeHooks: [{ name: 'test-hook', eventName: 'BeforeAgent' }],
      };
      const { lastFrame, unmount } = renderWithWidth(120, props);
      const output = stripAnsi(lastFrame()!);
      expect(output).toContain('Executing Hook: test-hook');
      unmount();
    });

    it('should render multiple executing hooks', () => {
      const props = {
        ...baseProps,
        activeHooks: [
          { name: 'h1', eventName: 'BeforeAgent' },
          { name: 'h2', eventName: 'BeforeAgent' },
        ],
      };
      const { lastFrame, unmount } = renderWithWidth(120, props);
      const output = stripAnsi(lastFrame()!);
      expect(output).toContain('Executing Hooks: h1, h2');
      unmount();
    });

    it('should render sequential hook progress', () => {
      const props = {
        ...baseProps,
        activeHooks: [
          { name: 'step', eventName: 'BeforeAgent', index: 1, total: 3 },
        ],
      };
      const { lastFrame, unmount } = renderWithWidth(120, props);
      const output = stripAnsi(lastFrame()!);
      expect(output).toContain('Executing Hook: step (1/3)');
      unmount();
    });

    it('should truncate hooks when they exceed terminal width', () => {
      const props = {
        ...baseProps,
        activeHooks: [
          { name: 'very-long-hook-name-one', eventName: 'BeforeAgent' },
          { name: 'very-long-hook-name-two', eventName: 'BeforeAgent' },
          { name: 'very-long-hook-name-three', eventName: 'BeforeAgent' },
        ],
      };
      // Width 60 -> maxChars for hooks ~24. The first hook name alone is 24 chars.
      const { lastFrame, unmount } = renderWithWidth(60, props);
      const output = stripAnsi(lastFrame()!);
      expect(output).toContain(
        'Executing Hooks: very-long-hook-name-one... (+2 more)',
      );
      unmount();
    });

    it('should respect showNotifications setting', () => {
      const props = {
        ...baseProps,
        activeHooks: [{ name: 'test-hook', eventName: 'BeforeAgent' }],
        showNotifications: false,
      };
      const { lastFrame, unmount } = renderWithWidth(120, props);
      expect(stripAnsi(lastFrame()!)).not.toContain('🪝');
      unmount();
    });
  });
});
