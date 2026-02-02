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
var DEBOUNCE_MS = 5e3;
var STORAGE_KEY = "epic_eao_analytics_last_recorded";
function trackAnalytics(options) {
  const {
    appName,
    centreApiUrl,
    enabled = true,
    onSuccess,
    onError,
    authState
  } = options;
  const { user, isAuthenticated } = useAuthState(authState);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const hasRecorded = useRef(false);
  useEffect(() => {
    if (!enabled || !isAuthenticated || !user || hasRecorded.current) {
      return;
    }
    if (wasRecentlyRecorded(appName)) {
      return;
    }
    if (!authState && !isIdirUser(user)) {
      return;
    }
    const userInfo = extractUserInfo(user);
    if (!userInfo) {
      console.warn("EAO Analytics: Could not extract user info");
      return;
    }
    const accessToken = user.access_token;
    if (!accessToken) {
      console.warn("EAO Analytics: No access token available");
      return;
    }
    recordAnalytics();
    async function recordAnalytics() {
      hasRecorded.current = true;
      setIsRecording(true);
      setError(null);
      try {
        await trackLogin(centreApiUrl, accessToken, {
          user_auth_guid: userInfo.user_auth_guid,
          app_name: appName
        });
        saveRecordedTimestamp(appName);
        onSuccess?.();
      } catch (err) {
        const e = err instanceof Error ? err : new Error("Unknown error");
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
function useAuthState(authState) {
  if (authState) {
    return {
      user: authState.user,
      isAuthenticated: authState.isAuthenticated
    };
  }
  const auth = useAuth();
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated
  };
}
function isIdirUser(user) {
  return user?.profile?.identity_provider === "idir";
}
function wasRecentlyRecorded(appName) {
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
function saveRecordedTimestamp(appName) {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ lastRecorded: Date.now(), appName })
  );
}
export {
  trackAnalytics
};
//# sourceMappingURL=index.mjs.map