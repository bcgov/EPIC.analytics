import { EaoAnalyticsPayload } from '../types';

/**
 * Record user login analytics by calling EPIC.centre API
 * @param apiUrl - Base URL of EPIC.centre API
 * @param accessToken - User's access token for authentication
 * @param payload - EAO Analytics payload
 */
export async function trackLogin(
  apiUrl: string,
  accessToken: string,
  payload: EaoAnalyticsPayload
): Promise<void> {
  if (!apiUrl) {
    throw new Error('EPIC.centre API URL is required');
  }

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const endpoint = `${baseUrl}/api/eao-analytics`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error(
        `EAO Analytics recording failed: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('EAO Analytics recording failed: Unknown error');
  }
}

