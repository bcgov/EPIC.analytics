// src/useEaoAnalytics.ts
import { useEffect, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";

// src/utils/tokenExtractor.ts
function extractUserInfo(user) {
  if (!user || !user.profile) {
    return null;
  }
  const profile = user.profile;
  const user_auth_guid = profile.preferred_username || profile.sub;
  if (!user_auth_guid) {
    return null;
  }
  return {
    user_auth_guid
  };
}

// src/utils/apiClient.ts
async function trackLogin(apiUrl, accessToken, payload) {
  if (!apiUrl) {
    throw new Error("EPIC.centre API URL is required");
  }
  if (!accessToken) {
    throw new Error("Access token is required");
  }
  const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
  const endpoint = `${baseUrl}/api/eao-analytics`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      keepalive: true
    });
    if (!response.ok) {
      throw new Error(
        `EAO Analytics recording failed: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error("EAO Analytics recording failed: Unknown error");
  }
}

// src/useEaoAnalytics.ts
var ANALYTICS_DEBOUNCE_MS = 5e3;
var SESSION_STORAGE_KEY = "epic_eao_analytics_last_recorded";
function trackAnalytics(options) {
  const { appName, centreApiUrl, enabled = true, onSuccess, onError, authState } = options;
  let user;
  let isAuthenticated;
  let authContext = {};
  try {
    authContext = useAuth();
  } catch (e) {
  }
  if (authState) {
    user = authState.user;
    isAuthenticated = authState.isAuthenticated;
  } else {
    user = authContext.user;
    isAuthenticated = authContext.isAuthenticated;
  }
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const recordingRef = useRef(false);
  useEffect(() => {
    if (!enabled || !isAuthenticated || !user) {
      return;
    }
    if (recordingRef.current) {
      return;
    }
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const state = JSON.parse(stored);
      const timeSinceLastRecord = Date.now() - state.lastRecorded;
      if (state.appName === appName && timeSinceLastRecord < ANALYTICS_DEBOUNCE_MS) {
        return;
      }
    }
    if (!authState) {
      const identityProvider = user.profile?.identity_provider;
      if (identityProvider !== "idir") {
        return;
      }
    }
    const userInfo = extractUserInfo(user);
    if (!userInfo) {
      console.warn("EAO Analytics: Could not extract user info from token");
      return;
    }
    const accessToken = user.access_token;
    if (!accessToken) {
      console.warn("EAO Analytics: No access token available");
      return;
    }
    const performAnalytics = async () => {
      recordingRef.current = true;
      setIsRecording(true);
      setError(null);
      try {
        await trackLogin(centreApiUrl, accessToken, {
          user_auth_guid: userInfo.user_auth_guid,
          app_name: appName
        });
        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            lastRecorded: Date.now(),
            appName
          })
        );
        onSuccess?.();
      } catch (err) {
        const error2 = err instanceof Error ? err : new Error("Unknown error");
        setError(error2);
        onError?.(error2);
      } finally {
        setIsRecording(false);
        recordingRef.current = false;
      }
    };
    performAnalytics();
  }, [isAuthenticated, user, appName, centreApiUrl, enabled, onSuccess, onError]);
  return {
    isRecording,
    error
  };
}
export {
  trackAnalytics
};
//# sourceMappingURL=index.mjs.map