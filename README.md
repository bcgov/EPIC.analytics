# @epic/centre-analytics

Drop-in React component to record IDIR user login analytics across EPIC applications.

## Installation

```bash
npm install @epic/centre-analytics
```

## Quick Start

Just render the `<EaoAnalytics />` component anywhere in your app:

```tsx
import { EaoAnalytics } from '@epic/centre-analytics';

function App() {
  return (
    <>
      <EaoAnalytics appName="epic_submit" centreApiUrl="https://your-api.com" />
      {/* ...rest of your app */}
    </>
  );
}
```

That's it! The component handles everything automatically.

---

## Usage by App Type

### Apps using `react-oidc-context` (Submit, Compliance, Conditions)

```tsx
<EaoAnalytics appName="epic_submit" centreApiUrl="https://your-api.com" />
```

### Apps using Redux (Engage, Track)

```tsx
import { EaoAnalytics, AnalyticsUser } from '@epic/centre-analytics';
import { useAppSelector } from './hooks';

function App() {
  const bearerToken = useAppSelector((state) => state.user.bearerToken);
  const isAuthenticated = useAppSelector((state) => state.user.authentication.authenticated);
  const userDetail = useAppSelector((state) => state.user.userDetail);

  const user: AnalyticsUser = {
    access_token: bearerToken || '',
    profile: { preferred_username: userDetail.preferred_username },
  };

  return (
    <>
      <EaoAnalytics
        appName="epic_engage"
        centreApiUrl="https://your-api.com"
        authState={{ user, isAuthenticated }}
      />
      {/* ...rest of app */}
    </>
  );
}
```

---

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `appName` | `EpicAppName` | Yes | App identifier |
| `centreApiUrl` | `string` | Yes | EPIC.centre API URL |
| `enabled` | `boolean` | No | Enable/disable (default: true) |
| `authState` | `object` | No | Manual auth for Redux apps |
| `onSuccess` | `() => void` | No | Success callback |
| `onError` | `(error) => void` | No | Error callback |

## Valid App Names

`epic_submit` | `epic_compliance` | `condition_repository` | `epic_engage` | `epic_track` | `epic_public`

---

## Notes

- **IDIR Only**: Only records analytics for IDIR users
- **Debouncing**: Won't re-record within 5 seconds
- **Optional Dependency**: `react-oidc-context` is optional if you provide `authState`
