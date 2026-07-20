# Firebase Realtime Database — debug logs

App writes to path `debug_logs/{pushId}` via anonymous Auth.

## Enable in Firebase Console

1. Authentication → Sign-in method → enable **Anonymous**
2. Realtime Database → Rules (staging-friendly example):

```json
{
  "rules": {
    "debug_logs": {
      ".read": "auth != null",
      ".write": "auth != null",
      ".indexOn": ["t", "appEnv"]
    }
  }
}
```

Tighten `.read` for production if needed (e.g. admin-only). The `/log` page signs in anonymously after password unlock, so `auth != null` is enough for internal use.

## Env keys (same names as local `.env`)

```
apiKey=
authDomain=
projectId=
appId=
databaseURL=
storageBucket=
messagingSenderId=
loginPassword=
NUXT_PUBLIC_APP_ENV=development
```

`NUXT_PUBLIC_APP_ENV` is stored on every log as `appEnv` (`development` | `staging` | `production` | `preview`).

## View logs

Open `/log` in the app and enter `loginPassword`, or browse `debug_logs` in the Firebase console.
