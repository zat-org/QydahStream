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
ScoreLandscape (etc.)
    → resolveThemeConfig(themeId)
         1. RTDB theme_configs/{themeId} if present
         2. else local getThemeConfig(themeId)
```

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

## Mental model

```
Store  = live match data
File   = default skin (repo)
RTDB   = optional override skin (editable in /config)
Shell  = one component per screen type
```
