# @epic/centre-analytics

React hook to record IDIR user login analytics across EPIC applications.

## Installation

```bash
npm install @epic/centre-analytics
```

## Usage

### Apps using `react-oidc-context` (Submit, Compliance, Conditions)

```tsx
import { trackAnalytics } from '@epic/centre-analytics';

function App() {
  trackAnalytics({
    appName: 'epic_submit',
    centreApiUrl: 'https://your-api.com',
  });

  return <div>...</div>;
}
```

### Apps using Redux (Engage, Track)

```tsx
import { trackAnalytics } from '@epic/centre-analytics';
import { useAppSelector } from './hooks';

function App() {
  const bearerToken = useAppSelector((state) => state.user.bearerToken);
  const isAuthenticated = useAppSelector((state) => state.user.authentication.authenticated);
  const userDetail = useAppSelector((state) => state.user.userDetail);

  trackAnalytics({
    appName: 'epic_engage',
    centreApiUrl: 'https://your-api.com',
    authState: {
      user: {
        access_token: bearerToken,
        profile: { preferred_username: userDetail.preferred_username },
      },
      isAuthenticated,
    },
  });

  return <div>...</div>;
}
```

## Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `appName` | `EpicAppName` | Yes | App identifier |
| `centreApiUrl` | `string` | Yes | EPIC.centre API URL |
| `enabled` | `boolean` | No | Enable/disable (default: true) |
| `authState` | `object` | No | Manual auth state for Redux apps |
| `onSuccess` | `() => void` | No | Callback on success |
| `onError` | `(error) => void` | No | Callback on error |

## Valid App Names

- `epic_submit`
- `epic_compliance`
- `condition_repository`
- `epic_engage`
- `epic_track`
- `epic_public`
