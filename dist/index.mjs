// src/EaoAnalytics.tsx
import { useEffect, useRef, useState } from "react";

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
    throw new Error(`EAO Analytics failed: ${response.status} ${response.statusText}`);
  }
}

// src/EaoAnalytics.tsx
var DEBOUNCE_MS = 5e3;
var STORAGE_KEY = "epic_eao_analytics_last_recorded";
function EaoAnalytics(props) {
  const {
    appName,
    centreApiUrl,
    enabled = true,
    onSuccess,
    onError,
    authState
  } = props;
  const { user, isAuthenticated } = useAuthState(authState);
  const [, setIsRecording] = useState(false);
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
      try {
        await trackLogin(centreApiUrl, accessToken, {
          user_auth_guid: userInfo.user_auth_guid,
          app_name: appName
        });
        saveRecordedTimestamp(appName);
        onSuccess?.();
      } catch (err) {
        const e = err instanceof Error ? err : new Error("Unknown error");
        onError?.(e);
      } finally {
        setIsRecording(false);
        hasRecorded.current = false;
      }
    }
  }, [isAuthenticated, user, appName, centreApiUrl, enabled, onSuccess, onError, authState]);
  return null;
}
function useAuthState(authState) {
  if (authState) {
    return {
      user: authState.user,
      isAuthenticated: authState.isAuthenticated
    };
  }
  const useAuthHook = getUseAuthHook();
  if (!useAuthHook) {
    console.warn("EAO Analytics: react-oidc-context not available. Please provide authState.");
    return { user: null, isAuthenticated: false };
  }
  const auth = useAuthHook();
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated
  };
}
var cachedUseAuth = void 0;
function getUseAuthHook() {
  if (cachedUseAuth !== void 0) return cachedUseAuth;
  try {
    const g = globalThis;
    if (g.require) {
      cachedUseAuth = g.require("react-oidc-context").useAuth;
    } else {
      cachedUseAuth = null;
    }
  } catch {
    cachedUseAuth = null;
  }
  return cachedUseAuth;
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
  EaoAnalytics
};
//# sourceMappingURL=index.mjs.map