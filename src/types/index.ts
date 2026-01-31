export type EpicAppName =
  | 'epic_submit'
  | 'condition_repository'
  | 'epic_compliance'
  | 'epic_engage'
  | 'epic_public'
  | 'epic_track';

export interface EaoAnalyticsOptions {
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
    user: any; // Using any to be flexible with different OIDC user shapes, but ideally matched to User
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

