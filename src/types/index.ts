export type EpicAppName =
  | 'epic_submit'
  | 'condition_repository'
  | 'epic_compliance'
  | 'epic_engage'
  | 'epic_public'
  | 'epic_track';

/**
 * User object for analytics.
 * Must have access_token and profile with preferred_username.
 */
export interface AnalyticsUser {
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
export interface EaoAnalyticsOptions {
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

export interface UserInfo {
  user_auth_guid: string;
}

export interface EaoAnalyticsPayload {
  user_auth_guid: string;
  app_name: EpicAppName;
}
