# Theme config plan (updated)

## Decisions (locked)

| Item | Choice |
|------|--------|
| Storage | **Same Firebase RTDB** as debug logs — path `theme_configs/{themeId}` |
| Auth | **Same as `/log`** — `loginPassword` + anonymous Firebase Auth |
| Fallback | Local files under `config/themes/*.ts` (e.g. `qydha.ts`) |
| Export | Copy / download JSON (same idea as `/log` Copy JSON) to update repo files |

## Resolve order (runtime)

```
1. Local file (sync seed for fast first paint)
2. RTDB theme_configs/{themeId} if present → use it
3. If RTDB missing → seed from file (create node once), then use RTDB
```

## How to view in Firebase Console

Theme config is **Realtime Database**, not Firestore.

1. Open [Firebase Console](https://console.firebase.google.com) → project **streamlog-80fd6**
2. Left menu → **Build → Realtime Database** (not Firestore)
3. Data tab → open node:
   - `theme_configs`
   - `theme_configs/qydha`
4. If empty: open app `/config` → unlock → **Publish file → RTDB** (or open a qydha board once — auto-seeds)

Also ensure Rules allow `theme_configs` read/write for `auth != null`.

Live scores/names stay in Pinia stores (SignalR). Config is **skin only**.

## Pages

| Route | Purpose |
|-------|---------|
| `/log` | Debug event stream |
| `/config` | Edit theme skins: theme tabs → screen tabs → Save to RTDB / Export JSON / Reset to file |

## RTDB rules (add beside debug_logs)

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

## Build steps

1. **Done (Step 1):** Local `qydha` baloot landscape score + `ScoreLandscape`
2. **This step:** RTDB resolve + wire ScoreLandscape + `/config` (score edit for themes that have local score)
3. **Next:** Harvest zat score → same shell; then detail / statics / winner configs + editors

## Live updates

- Board pages **subscribe** to `theme_configs/{id}` (no refresh needed for position/timing/video path in config).
- `/config` **auto-saves** edits to RTDB after ~700ms debounce.
