/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivateSkillTool } from './activate-skill.js';
import type { Config } from '../config/config.js';

describe('ActivateSkillTool', () => {
  let mockConfig: Config;
  let tool: ActivateSkillTool;

  beforeEach(() => {
    mockConfig = {
      getSkillDiscoveryService: vi.fn().mockReturnValue({
        getSkills: vi.fn().mockReturnValue([
          {
            name: 'test-skill',
            description: 'A test skill',
            location: '/path/to/test-skill/SKILL.md',
          },
        ]),
        getSkillContent: vi.fn().mockResolvedValue({
          name: 'test-skill',
          description: 'A test skill',
          location: '/path/to/test-skill/SKILL.md',
          body: 'Skill instructions content.',
        }),
      }),
      activateSkill: vi.fn(),
    } as unknown as Config;
    tool = new ActivateSkillTool(mockConfig);
  });

  it('should activate a valid skill and return its content', async () => {
    const params = { name: 'test-skill' };
    const invocation = (
      tool as unknown as {
        createInvocation: (params: unknown) => {
          execute: (signal: AbortSignal) => Promise<{
            llmContent: string;
            returnDisplay: string;
          }>;
        };
      }
    ).createInvocation(params);
    const result = await invocation.execute(new AbortController().signal);

    expect(mockConfig.activateSkill).toHaveBeenCalledWith('test-skill');
    expect(result.llmContent).toContain(
      'Skill "test-skill" activated successfully',
    );
    expect(result.llmContent).toContain('Skill instructions content.');
    expect(result.returnDisplay).toBe('Skill "test-skill" activated.');
  });

  it('should return an error if skill is not found', async () => {
    const params = { name: 'non-existent' };
    const invocation = (
      tool as unknown as {
        createInvocation: (params: unknown) => {
          execute: (signal: AbortSignal) => Promise<{
            llmContent: string;
            returnDisplay: string;
          }>;
        };
      }
    ).createInvocation(params);
    const result = await invocation.execute(new AbortController().signal);

    expect(result.llmContent).toContain(
      'Error: Skill "non-existent" not found',
    );
    expect(result.returnDisplay).toBe('Skill "non-existent" not found.');
    expect(mockConfig.activateSkill).not.toHaveBeenCalled();
  });

  it('should return an error if skill content cannot be read', async () => {
    vi.mocked(
      mockConfig.getSkillDiscoveryService().getSkillContent,
    ).mockResolvedValue(null);
    const params = { name: 'test-skill' };
    const invocation = (
      tool as unknown as {
        createInvocation: (params: unknown) => {
          execute: (signal: AbortSignal) => Promise<{
            llmContent: string;
            returnDisplay: string;
          }>;
        };
      }
    ).createInvocation(params);
    const result = await invocation.execute(new AbortController().signal);

    expect(result.llmContent).toContain(
      'Error: Could not read content for skill "test-skill"',
    );
    expect(mockConfig.activateSkill).not.toHaveBeenCalled();
  });

  it('should validate that name is provided', () => {
    expect(() =>
      tool.build({ name: '' } as unknown as { name: string }),
    ).toThrow("The 'name' parameter must be non-empty");
  });
});
