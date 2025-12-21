/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { type IdeContext, type MCPServerConfig } from '@google/gemini-cli-core';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';
import { type ActiveHook } from '../types.js';

interface ContextSummaryDisplayProps {
  geminiMdFileCount: number;
  contextFileNames: string[];
  mcpServers?: Record<string, MCPServerConfig>;
  blockedMcpServers?: Array<{ name: string; extensionName: string }>;
  ideContext?: IdeContext;
  activeHooks?: ActiveHook[];
  showNotifications?: boolean;
}

export const ContextSummaryDisplay: React.FC<ContextSummaryDisplayProps> = ({
  geminiMdFileCount,
  contextFileNames,
  mcpServers,
  blockedMcpServers,
  ideContext,
  activeHooks = [],
  showNotifications = true,
}) => {
  const { columns: terminalWidth } = useTerminalSize();
  const isNarrow = isNarrowWidth(terminalWidth);
  const mcpServerCount = Object.keys(mcpServers || {}).length;
  const blockedMcpServerCount = blockedMcpServers?.length || 0;
  const openFileCount = ideContext?.workspaceState?.openFiles?.length ?? 0;

  if (
    geminiMdFileCount === 0 &&
    mcpServerCount === 0 &&
    blockedMcpServerCount === 0 &&
    openFileCount === 0 &&
    (activeHooks.length === 0 || !showNotifications)
  ) {
    return <Text> </Text>; // Render an empty space to reserve height
  }

  const openFilesText = (() => {
    if (openFileCount === 0) {
      return '';
    }
    return `${openFileCount} open file${
      openFileCount > 1 ? 's' : ''
    } (ctrl+g to view)`;
  })();

  const geminiMdText = (() => {
    if (geminiMdFileCount === 0) {
      return '';
    }
    const allNamesTheSame = new Set(contextFileNames).size < 2;
    const name = allNamesTheSame ? contextFileNames[0] : 'context';
    return `${geminiMdFileCount} ${name} file${
      geminiMdFileCount > 1 ? 's' : ''
    }`;
  })();

  const mcpText = (() => {
    if (mcpServerCount === 0 && blockedMcpServerCount === 0) {
      return '';
    }

    const parts = [];
    if (mcpServerCount > 0) {
      parts.push(
        `${mcpServerCount} MCP server${mcpServerCount > 1 ? 's' : ''}`,
      );
    }

    if (blockedMcpServerCount > 0) {
      let blockedText = `${blockedMcpServerCount} Blocked`;
      if (mcpServerCount === 0) {
        blockedText += ` MCP server${blockedMcpServerCount > 1 ? 's' : ''}`;
      }
      parts.push(blockedText);
    }
    return parts.join(', ');
  })();

  const hooksText = (() => {
    if (activeHooks.length === 0 || !showNotifications) {
      return '';
    }

    const label = activeHooks.length > 1 ? 'Executing Hooks' : 'Executing Hook';
    let currentChars = label.length + 4; // emoji (2) + label + ": " (2)
    const displayedHooks = [];
    let hiddenCount = 0;

    // Determine how many hooks we can display based on terminal width
    const maxChars = Math.floor(terminalWidth * 0.4);

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

    let result = `🪝 ${label}: ${displayedHooks.join(', ')}`;
    if (hiddenCount > 0) {
      result += `... (+${hiddenCount} more)`;
    }
    return result;
  })();

  const summaryParts = [openFilesText, geminiMdText, mcpText].filter(Boolean);

  const renderPart = (
    text: string,
    isLast: boolean,
    color = theme.text.secondary,
  ) => (
    <Box key={text} flexShrink={0}>
      <Text color={color} wrap="truncate">
        {text}
      </Text>
      {!isLast && (
        <Text color={theme.text.secondary} wrap="truncate">
          {' | '}
        </Text>
      )}
    </Box>
  );

  if (isNarrow) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color={theme.text.secondary} wrap="truncate">
          Using:
        </Text>
        {summaryParts.map((part) => (
          <Text key={part} color={theme.text.secondary} wrap="truncate">
            {'  '}- {part}
          </Text>
        ))}
        {hooksText && (
          <Text color={theme.status.warning} wrap="truncate">
            {'  '}- {hooksText}
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Box paddingX={1} flexDirection="row">
      <Box flexShrink={0}>
        <Text color={theme.text.secondary} wrap="truncate">
          Using:{' '}
        </Text>
      </Box>
      {summaryParts.map((part, index) =>
        renderPart(part, index === summaryParts.length - 1 && !hooksText),
      )}
      {hooksText && (
        <Box marginLeft={summaryParts.length > 0 ? 0 : 0} flexShrink={0}>
          {summaryParts.length > 0 && (
            <Text color={theme.text.secondary} wrap="truncate">
              {' | '}
            </Text>
          )}
          <Text color={theme.status.warning} wrap="truncate">
            {hooksText}
          </Text>
        </Box>
      )}
    </Box>
  );
};
