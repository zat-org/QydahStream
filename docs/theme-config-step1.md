# Theme config — Step 1 (done)

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
| `config/themes/index.ts` | Lookup theme by id |
| `config/themeRegistry.ts` | If config exists → shared shell |
| `components/landscape/ScoreLandscape.vue` | One score component driven by config + Baloot store |

## What changed on pages

Baloot / legacy `/[id]` / tournament: for **qydha + landscape + score**, use config-driven shell.  
Zat landscape and all portrait still use the old Vue files.

## How to test

Open:

`/baloot/{id}?theme=qydha&orientation=landscape`

Should look like the old Qydha score. Change numbers in `config/themes/qydha.ts` (e.g. `wrapLeftPx`) to prove config drives layout.

## Next steps (when you say go)

1. Harvest **Zat** baloot landscape score into `config/themes/zat.ts` → same `ScoreLandscape`
2. Harvest **Detail** screen → `DetailLandscape.vue` + config
3. Then **Statics** / **Winner**
4. Later Hand landscape score (Hand store wiring)
