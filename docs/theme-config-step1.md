# Theme config — Step 1 (done)

See full plan: [theme-config-plan.md](./theme-config-plan.md)

## Same mental model

```
Store  = live scores / names / events
Config = video path, positions, timings (skin)
One ScoreLandscape shell reads both
```

## What we built

| Piece | Role |
|-------|------|
| `config/themes/types.ts` | Shape of landscape score config |
| `config/themes/qydha.ts` | Harvested from old Qydha baloot score Vue |
| `config/themes/index.ts` | Lookup theme by id (file fallback) |
| `config/themeRegistry.ts` | If config exists → shared shell |
| `components/landscape/ScoreLandscape.vue` | One score component driven by config + Baloot store |

## Next (this sprint)

1. RTDB `theme_configs/{id}` + resolve RTDB \|\| file  
2. Wire ScoreLandscape to resolver  
3. `/config` page (password like `/log`, theme/screen tabs, Save, Export JSON)
