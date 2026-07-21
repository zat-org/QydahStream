# Theme config — Step 1 + Detail/Winner

See full plan: [theme-config-plan.md](./theme-config-plan.md)

## Same mental model

```
Store  = live scores / names / events
Config = video path, positions, timings (skin)
One landscape shell per screen reads both
```

## What we built

| Piece | Role |
|-------|------|
| `config/themes/types.ts` | Score + Detail + Winner landscape config shapes |
| `config/themes/qydha.ts` | Harvested Qydha baloot landscape score / detail / winner |
| `config/themes/index.ts` | Lookup theme by id (file fallback) |
| `config/themeRegistry.ts` | Resolve score / detail / winner → shared shells |
| `components/landscape/ScoreLandscape.vue` | Score shell |
| `components/landscape/DetailLandscape.vue` | Detail shell |
| `components/landscape/WinnerLandscape.vue` | Winner shell |
| `/config` | Edit score, detail, winner (statics deferred) |

## Deferred

- **Statics:** Qydha has no landscape statics Vue (portrait only). `/config` statics tab stays unavailable until a landscape design exists (or a separate portrait-config pass).

## Next

1. Harvest zat landscape screens into the same shells (or zat-specific configs)
2. Portrait config shells if needed
3. Hand game screens
