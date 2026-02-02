type EpicAppName = 'epic_submit' | 'condition_repository' | 'epic_compliance' | 'epic_engage' | 'epic_public' | 'epic_track';
interface EaoAnalyticsOptions {
    appName: EpicAppName;
    centreApiUrl: string;
    enabled?: boolean;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    /**
     * Optional manual auth state injection.
     * Use this if your app does not use react-oidc-context's useAuth hook.
     */
    authState?: {
        user: any;
        isAuthenticated: boolean;
    };
}
interface UserInfo {
    user_auth_guid: string;
}
interface EaoAnalyticsPayload {
    user_auth_guid: string;
    app_name: EpicAppName;
}

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
declare function trackAnalytics(options: EaoAnalyticsOptions): {
    isRecording: boolean;
    error: Error | null;
};

export { type EaoAnalyticsOptions, type EaoAnalyticsPayload, type EpicAppName, type UserInfo, trackAnalytics };
