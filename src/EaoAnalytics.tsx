import { useEffect, useRef, useState } from 'react';
import { extractUserInfo } from './utils/tokenExtractor';
import { trackLogin } from './utils/apiClient';
import { EaoAnalyticsOptions } from './types';

const DEBOUNCE_MS = 5000;
const STORAGE_KEY = 'epic_eao_analytics_last_recorded';

/**
 * EaoAnalytics Component
 *
 * Drop-in component to record IDIR user login analytics.
 * Just render it anywhere in your app - no wrapping needed.
 *
 * @example
 * // Apps using react-oidc-context (Submit, Compliance, Conditions):
 * <EaoAnalytics appName="epic_submit" centreApiUrl="..." />
 *
 * @example
 * // Apps using Redux (Engage, Track):
 * <EaoAnalytics
 *   appName="epic_engage"
 *   centreApiUrl="..."
 *   authState={{ user, isAuthenticated }}
 * />
 */
export function EaoAnalytics(props: EaoAnalyticsOptions): null {
    const {
        appName,
        centreApiUrl,
        enabled = true,
        onSuccess,
        onError,
        authState,
    } = props;

    // Get user from authState or react-oidc-context
    const { user, isAuthenticated } = useAuthState(authState);

    const [, setIsRecording] = useState(false);
    const hasRecorded = useRef(false);

    useEffect(() => {
        // Skip if disabled, not authenticated, or already recorded
        if (!enabled || !isAuthenticated || !user || hasRecorded.current) {
            return;
        }

        // Skip if recorded recently (debounce)
        if (wasRecentlyRecorded(appName)) {
            return;
        }

        // For OIDC apps, check if user is IDIR. For Redux apps, assume IDIR-only.
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

        // Record analytics
        recordAnalytics();

        async function recordAnalytics() {
            hasRecorded.current = true;
            setIsRecording(true);

            try {
                await trackLogin(centreApiUrl, accessToken, {
                    user_auth_guid: userInfo!.user_auth_guid,
                    app_name: appName,
                });

                saveRecordedTimestamp(appName);
                onSuccess?.();
            } catch (err) {
                const e = err instanceof Error ? err : new Error('Unknown error');
                onError?.(e);
            } finally {
                setIsRecording(false);
                hasRecorded.current = false;
            }
        }
    }, [isAuthenticated, user, appName, centreApiUrl, enabled, onSuccess, onError, authState]);

    // Render nothing - this is a "headless" component
    return null;
}

// --- Helper Functions ---

/**
 * Get user from injected authState or dynamically load react-oidc-context.
 */
function useAuthState(authState?: EaoAnalyticsOptions['authState']) {
    // If authState is provided, use it directly (Redux apps)
    if (authState) {
        return {
            user: authState.user,
            isAuthenticated: authState.isAuthenticated,
        };
    }

    // Otherwise, try to use react-oidc-context (OIDC apps)
    // Dynamic import to make react-oidc-context optional
    const useAuthHook = getUseAuthHook();
    if (!useAuthHook) {
        console.warn('EAO Analytics: react-oidc-context not available. Please provide authState.');
        return { user: null, isAuthenticated: false };
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const auth = useAuthHook();
    return {
        user: auth.user,
        isAuthenticated: auth.isAuthenticated,
    };
}

// Cached hook reference
let cachedUseAuth: any = undefined;

function getUseAuthHook(): any {
    if (cachedUseAuth !== undefined) return cachedUseAuth;

    try {
        // Access require via globalThis to avoid TypeScript errors
        const g = globalThis as any;
        if (g.require) {
            cachedUseAuth = g.require('react-oidc-context').useAuth;
        } else {
            cachedUseAuth = null;
        }
    } catch {
        cachedUseAuth = null;
    }
    return cachedUseAuth;
}

/**
 * Check if user has IDIR identity provider.
 */
function isIdirUser(user: any): boolean {
    return user?.profile?.identity_provider === 'idir';
}

/**
 * Check if analytics was recorded recently (within debounce window).
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
 * Save timestamp when analytics was recorded.
 */
function saveRecordedTimestamp(appName: string): void {
    sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ lastRecorded: Date.now(), appName })
    );
}
