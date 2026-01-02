"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  trackAnalytics: () => trackAnalytics
});
module.exports = __toCommonJS(index_exports);

// src/useEaoAnalytics.ts
var import_react = require("react");
var import_react_oidc_context = require("react-oidc-context");

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
var import_axios = __toESM(require("axios"));
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
    await import_axios.default.post(
      endpoint,
      payload,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        timeout: 1e4
      }
    );
  } catch (error) {
    if (import_axios.default.isAxiosError(error)) {
      const axiosError = error;
      if (axiosError.response) {
        throw new Error(
          `EAO Analytics recording failed: ${axiosError.response.status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error("EAO Analytics recording failed: No response from server");
      }
    }
    throw error instanceof Error ? error : new Error("EAO Analytics recording failed: Unknown error");
  }
}

// src/useEaoAnalytics.ts
var ANALYTICS_DEBOUNCE_MS = 5e3;
var SESSION_STORAGE_KEY = "epic_eao_analytics_last_recorded";
function trackAnalytics(options) {
  const { appName, centreApiUrl, enabled = true, onSuccess, onError } = options;
  const { user, isAuthenticated } = (0, import_react_oidc_context.useAuth)();
  const [isRecording, setIsRecording] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const recordingRef = (0, import_react.useRef)(false);
  (0, import_react.useEffect)(() => {
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
    const identityProvider = user.profile?.identity_provider;
    if (identityProvider !== "idir") {
      return;
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  trackAnalytics
});
//# sourceMappingURL=index.js.map