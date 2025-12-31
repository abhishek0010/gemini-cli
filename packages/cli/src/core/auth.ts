/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  type AuthType,
  type Config,
  getErrorMessage,
  FatalCancellationError,
  InteractionRequiredError,
} from '@google/gemini-cli-core';

export const INTERACTION_REQUIRED = 'INTERACTION_REQUIRED';

/**
 * Handles the initial authentication flow.
 * @param config The application config.
 * @param authType The selected auth type.
 * @param silentAuthOnly If true, will not trigger interactive login flows.
 * @returns An error message if authentication fails, otherwise null.
 */
export async function performInitialAuth(
  config: Config,
  authType: AuthType | undefined,
  silentAuthOnly = false,
): Promise<string | null> {
  if (!authType) {
    return null;
  }

  try {
    if (silentAuthOnly) {
      (config as any).silentAuthOnly = true;
    }
    await config.refreshAuth(authType);
    // The console.log is intentionally left out here.
    // We can add a dedicated startup message later if needed.
  } catch (e) {
    if (silentAuthOnly && e instanceof InteractionRequiredError) {
      return INTERACTION_REQUIRED;
    }
    if (e instanceof FatalCancellationError) {
      // Use an empty string as a sentinel for cancellation.
      // This will still trigger shouldOpenAuthDialog (!!authError) but
      // AppContainer will see it as no message to display.
      return '';
    }
    return `Failed to login. Message: ${getErrorMessage(e)}`;
  } finally {
    if (silentAuthOnly) {
      delete (config as any).silentAuthOnly;
    }
  }

  return null;
}
