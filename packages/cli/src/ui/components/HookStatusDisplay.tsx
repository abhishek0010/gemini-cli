/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { type ActiveHook } from '../types.js';

interface HookStatusDisplayProps {
  activeHooks: ActiveHook[];
}

export const HookStatusDisplay: React.FC<HookStatusDisplayProps> = ({
  activeHooks,
}) => {
  const { columns: terminalWidth } = useTerminalSize();

  const hooksText = (() => {
    if (activeHooks.length === 0) {
      return '';
    }

    const label = activeHooks.length > 1 ? 'Executing Hooks' : 'Executing Hook';
    let currentChars = label.length + 2; // label + ": " (2)
    const displayedHooks = [];
    let hiddenCount = 0;

    // Use a larger portion of the screen since we are overwriting the summary
    const maxChars = Math.floor(terminalWidth * 0.8);

    for (let i = 0; i < activeHooks.length; i++) {
      const hook = activeHooks[i];
      let hookDisplayName = hook.name;
      if (hook.index && hook.total && hook.total > 1) {
        hookDisplayName += ` (${hook.index}/${hook.total})`;
      }

      if (currentChars + hookDisplayName.length + 2 > maxChars && i > 0) {
        hiddenCount = activeHooks.length - i;
        break;
      }

      displayedHooks.push(hookDisplayName);
      currentChars += hookDisplayName.length + 2;
    }

    let result = `${label}: ${displayedHooks.join(', ')}`;
    if (hiddenCount > 0) {
      result += `... (+${hiddenCount} more)`;
    }
    return result;
  })();

  if (!hooksText) return null;

  return (
    <Text color={theme.status.warning} wrap="truncate">
      {hooksText}
    </Text>
  );
};
