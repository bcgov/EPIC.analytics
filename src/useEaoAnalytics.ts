import { useEffect, useRef, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { extractUserInfo } from './utils/tokenExtractor';
import { trackLogin } from './utils/apiClient';
import { EaoAnalyticsOptions } from './types';

const DEBOUNCE_MS = 5000;
const STORAGE_KEY = 'epic_eao_analytics_last_recorded';

/**
 * Hook to record IDIR user login analytics for EPIC applications.
 *
 * Usage:
 *   // Apps using react-oidc-context (Submit, Compliance, Conditions):
 *   trackAnalytics({ appName: 'epic_submit', centreApiUrl: '...' });
 *
 *   // Apps using Redux (Engage, Track):
 *   trackAnalytics({
 *     appName: 'epic_engage',
 *     centreApiUrl: '...',
 *     authState: { user, isAuthenticated }
 *   });
 */
export function trackAnalytics(options: EaoAnalyticsOptions) {
  const {
    appName,
    centreApiUrl,
    enabled = true,
    onSuccess,
    onError,
    authState,
  } = options;

  // Get user from either injected authState or react-oidc-context
  const { user, isAuthenticated } = useAuthState(authState);

  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasRecorded = useRef(false);

  useEffect(() => {
    // Skip if disabled, not authenticated, or already recording
    if (!enabled || !isAuthenticated || !user || hasRecorded.current) {
      return;
    }

    // Skip if we recorded recently (debounce)
    if (wasRecentlyRecorded(appName)) {
      return;
    }

    // For apps using react-oidc-context, check if user is IDIR
    // For apps using authState (Redux), assume IDIR-only
    if (!authState && !isIdirUser(user)) {
      return;
    }

    // Extract user info
    const userInfo = extractUserInfo(user);
    if (!userInfo) {
      console.warn('EAO Analytics: Could not extract user info');
      return;
    }

    const accessToken = user.access_token;
    if (!accessToken) {
      console.warn('EAO Analytics: No access token available');
      return;
    }

    // Record the analytics
    recordAnalytics();

    async function recordAnalytics() {
      hasRecorded.current = true;
      setIsRecording(true);
      setError(null);

      try {
        await trackLogin(centreApiUrl, accessToken, {
          user_auth_guid: userInfo!.user_auth_guid,
          app_name: appName,
        });

        saveRecordedTimestamp(appName);
        onSuccess?.();
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Unknown error');
        setError(e);
        onError?.(e);
      } finally {
        setIsRecording(false);
        hasRecorded.current = false;
      }
    }
  }, [isAuthenticated, user, appName, centreApiUrl, enabled, onSuccess, onError, authState]);

  return { isRecording, error };
}

// --- Helper Functions ---

/**
 * Get user authentication state from either injected authState or useAuth hook.
 */
function useAuthState(authState?: EaoAnalyticsOptions['authState']) {
  // If authState is provided, use it directly
  if (authState) {
    return {
      user: authState.user,
      isAuthenticated: authState.isAuthenticated,
    };
  }

  // Otherwise, use the react-oidc-context hook
  // This will throw if not wrapped in AuthProvider, which is expected
  const auth = useAuth();
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
  };
}

/**
 * Check if user has IDIR identity provider.
 */
function isIdirUser(user: any): boolean {
  return user?.profile?.identity_provider === 'idir';
}

/**
 * Check if analytics was recorded recently for this app (within debounce window).
 */
function wasRecentlyRecorded(appName: string): boolean {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return false;

  try {
    const { lastRecorded, appName: storedApp } = JSON.parse(stored);
    const elapsed = Date.now() - lastRecorded;
    return storedApp === appName && elapsed < DEBOUNCE_MS;
  } catch {
    return false;
  }
}

/**
 * Save the current timestamp as last recorded for this app.
 */
function saveRecordedTimestamp(appName: string): void {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ lastRecorded: Date.now(), appName })
  );
}
