type EpicAppName = 'epic_submit' | 'condition_repository' | 'epic_compliance' | 'epic_engage' | 'epic_public' | 'epic_track';
/**
 * User object for analytics.
 * Must have access_token and profile with preferred_username.
 */
interface AnalyticsUser {
    access_token: string;
    profile: {
        preferred_username?: string;
        sub?: string;
        identity_provider?: string;
    };
}
/**
 * Props for the EaoAnalytics component.
 */
interface EaoAnalyticsOptions {
    /** App identifier */
    appName: EpicAppName;
    /** EPIC.centre API URL */
    centreApiUrl: string;
    /** Enable/disable analytics (default: true) */
    enabled?: boolean;
    /** Callback on successful recording */
    onSuccess?: () => void;
    /** Callback on error */
    onError?: (error: Error) => void;
    /**
     * Manual auth state for apps not using react-oidc-context (e.g., Redux apps).
     * If not provided, will attempt to use react-oidc-context's useAuth hook.
     */
    authState?: {
        user: AnalyticsUser | null;
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
declare function EaoAnalytics(props: EaoAnalyticsOptions): null;

export { type AnalyticsUser, EaoAnalytics, type EaoAnalyticsOptions, type EaoAnalyticsPayload, type EpicAppName, type UserInfo };
