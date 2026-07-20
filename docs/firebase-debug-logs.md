# Firebase Realtime Database — debug logs + theme configs

App uses anonymous Auth for:

- `debug_logs/{pushId}` — overlay debug events (`/log`)
- `theme_configs/{themeId}` — theme skin overrides (`/config`, ScoreLandscape resolve)

## Enable in Firebase Console

1. Authentication → Sign-in method → enable **Anonymous**
2. Realtime Database → Rules:

```json
{
  "rules": {
    "debug_logs": {
      ".read": "auth != null",
      ".write": "auth != null",
      ".indexOn": ["t", "appEnv"]
    },
    "theme_configs": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

Both `/log` and `/config` use `loginPassword` from `.env` (same unlock session key).

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

## Theme resolve order

1. RTDB `theme_configs/{themeId}` if present  
2. Else local `config/themes/{themeId}.ts`

Export JSON from `/config` to update the repo file when you want the fallback to match production edits.
