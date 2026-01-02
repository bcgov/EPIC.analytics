type EpicAppName = 'epic_submit' | 'condition_repository' | 'epic_compliance' | 'epic_engage' | 'epic_public';
interface EaoAnalyticsOptions {
    appName: EpicAppName;
    centreApiUrl: string;
    enabled?: boolean;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}
interface UserInfo {
    user_auth_guid: string;
}
interface EaoAnalyticsPayload {
    user_auth_guid: string;
    app_name: EpicAppName;
}

/**
 * React hook to record user login analytics across EPIC applications
 * Automatically records login analytics when user is authenticated
 */
declare function trackAnalytics(options: EaoAnalyticsOptions): {
    isRecording: boolean;
    error: Error | null;
};

export { type EaoAnalyticsOptions, type EaoAnalyticsPayload, type EpicAppName, type UserInfo, trackAnalytics };
