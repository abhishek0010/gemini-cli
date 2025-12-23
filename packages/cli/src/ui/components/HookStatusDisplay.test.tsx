/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { render } from '../../test-utils/render.js';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { HookStatusDisplay } from './HookStatusDisplay.js';
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
  props: React.ComponentProps<typeof HookStatusDisplay>,
) => {
  useTerminalSizeMock.mockReturnValue({ columns: width, rows: 24 });
  return render(<HookStatusDisplay {...props} />);
};

describe('<HookStatusDisplay />', () => {
  it('should render a single executing hook', () => {
    const props = {
      activeHooks: [{ name: 'test-hook', eventName: 'BeforeAgent' }],
    };
    const { lastFrame, unmount } = renderWithWidth(120, props);
    expect(lastFrame()).toMatchSnapshot();
    unmount();
  });

  it('should render multiple executing hooks', () => {
    const props = {
      activeHooks: [
        { name: 'h1', eventName: 'BeforeAgent' },
        { name: 'h2', eventName: 'BeforeAgent' },
      ],
    };
    const { lastFrame, unmount } = renderWithWidth(120, props);
    expect(lastFrame()).toMatchSnapshot();
    unmount();
  });

  it('should render sequential hook progress', () => {
    const props = {
      activeHooks: [
        { name: 'step', eventName: 'BeforeAgent', index: 1, total: 3 },
      ],
    };
    const { lastFrame, unmount } = renderWithWidth(120, props);
    expect(lastFrame()).toMatchSnapshot();
    unmount();
  });

  it('should truncate hooks when they exceed terminal width', () => {
    const props = {
      activeHooks: [
        { name: 'very-long-hook-name-one', eventName: 'BeforeAgent' },
        { name: 'very-long-hook-name-two', eventName: 'BeforeAgent' },
        { name: 'very-long-hook-name-three', eventName: 'BeforeAgent' },
      ],
    };
    // Width 40 -> maxChars for hooks ~32 (0.8 * 40).
    // The first hook is 23 chars.
    // label overhead is ~19 chars.
    // 1st hook pushes it over 32, but it's i=0 so it displays.
    // 2nd hook triggers truncation.
    const { lastFrame, unmount } = renderWithWidth(40, props);

    expect(lastFrame()).toMatchSnapshot();
    unmount();
  });

  it('should return empty string if no active hooks', () => {
    const props = { activeHooks: [] };
    const { lastFrame, unmount } = renderWithWidth(120, props);
    expect(lastFrame()).toBe('');
    unmount();
  });
});
