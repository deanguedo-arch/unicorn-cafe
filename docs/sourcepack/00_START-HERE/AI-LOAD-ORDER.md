# AI Load Order

When giving this source pack to ChatGPT, Claude, Codex, or another builder, use this order:

1. `00_START-HERE/README.md`
2. `01_CANONICAL/UNIVERSE-BIBLE.md`
3. `01_CANONICAL/GAMEPLAY-v14.md`
4. `01_CANONICAL/ART-DIRECTION.md`
5. `01_CANONICAL/TECHNICAL-CONSTRAINTS.md`
6. `01_CANONICAL/DEPRECATED-RULES.md`
7. `03_ASSETS/ASSET-CATALOG.md`
8. Then load only the historical files needed for the task.

## Conflict rule
If a historical document conflicts with `01_CANONICAL`, the canonical document wins.

## Latest implementation
Use `02_LATEST-v14/source/index.html` as the current implementation reference. It is not automatically the design authority if a future canonical document deliberately changes a rule.
