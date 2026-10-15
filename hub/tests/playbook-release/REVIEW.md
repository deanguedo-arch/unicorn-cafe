# Unicorn World adventures release candidate — 2026-10-14

The implementation follows the approved three-stage plan in this chat. The existing bedroom illustration, canonical character, sports handoff art, native saves and coin prices remain authoritative. Nine new furniture sprites were generated against the existing upstairs artwork; original provenance and atlas layout are in `hub/assets/playbook/PROVENANCE.json`.

## Changes

- Helpers retain transient routes, recover stalls and keep independent jobs, hiring costs, carried dishes and shift limits. Existing happy frames, job pictures, favourite requests and dismissible cooking/navigation hints clarify the next action.
- The backpack opens three optional picture adventures. Each has an independent run; real actions advance it. Atomic first-completion gifts and permanent cards cannot be multiplied by replay or delayed delivery.
- Six free bedroom objects and three earned gifts use generous floor snaps, away from the stairs. Invalid drops retain the previous placement; putting objects away retains ownership.
- Six scrapbook pages each hold four memories. Pinned photos have independent IndexedDB image copies and survive the 24-photo album rollover. Child-frame broadcasts exclude scrapbook media.
- Tennis and volleyball offer slower practice without competitive unlocks or currency changes. Friendly opponents remain selectable. Durable sports facts and separate practice/competitive bests survive interruptions.

## Evidence and results

- Helper matrix: 13 groups, including 80 isolated jobs, concurrent jobs at 30/60/120 Hz and varied timing, stuck saves, interrupted carrying/washing, manual takeover, expiry and native-schema preservation.
- Existing restaurant engine: 30 groups. Existing integration engine: four groups. Restaurant hints/helpers: 10 actual-browser checks in each Chromium and WebKit, including 44-pixel touch targets.
- Seated-dining regression: actual customer order/serve/pay/exit flows, 50 layering cases, six responsive/safe-area layouts and 30 tablecloth variants passed. Its furniture-only fixture now isolates idle helpers, just as it already isolated the player; no artwork was changed.
- Shared state: 39 checks passed, covering an already-initialized legacy profile, all adventure completions, switching/replay, stale events, duplicate payouts, storage abort/rollback/retry, media retention after 26 later photos and reload.
- Sports: 14 state/physics checks and 12 browser checks in each engine passed, including starting an outing mid-match and delayed facts remaining bound to their original run.
- New packaged UI: 11 groups in each engine passed. Actual outfit/photo/home-display, picnic, decoration and scrapbook actions were exercised. Chromium used native touch drags; WebKit used touch taps and pointer drags. Both existing games launched and acknowledged return. Portrait suspension and long-press protection passed.
- Independent review: 11 Chromium and 10 WebKit groups at 568×320 and 852×393 passed after fixing page-control overlap, clipped header navigation and vertical touch gesture cancellation. 20 doors/stations and 63 guide combinations were reachable; six additional real-browser hint/navigation checks passed.
- Existing shopping preview regression: 15 checks per engine passed. Offline worker: nine checks passed. Clean package: 1,239 files; all checksums and original background bytes passed, with source ZIPs/tests excluded from deployment.

## Comparison and limits

| Area | Result | Evidence |
|---|---|---|
| Picture guidance / teaching clarity | Improved in simulated and browser checks | Job pictures, next-action demonstrations, three-step book; child comprehension remains unverified |
| Visual usefulness | Improved in reviewed screens | Matching furniture art, preview cards, >=44px controls, no scrapbook-control overlap |
| Learner effort | Improved in exercised flows | One-tap owned outfit step, forgiving snap positions, slow practice, persistent progress |
| Functionality | Improved | Fixed realistic-frame helper routes, durable facts, permanent photo storage; existing launches and economy checks pass |

Physical-phone use and the six-year-old's comprehension remain separate acceptance checks. Shared-world offline support is unchanged. Local cloud-file hydration stalled on several unchanged assets, so browser review served their exact Git bytes and the final clean build used tracked source bytes with only the intended edits/new files.

Prevention: the existing publishing test command now runs the realistic helper timing matrix and durable sports regression checks. Keep the native vertical-touch and control hit-testing cases in browser release testing; mouse-only dragging and low-frequency helper ticks missed the previous failures.

Hosted deployment and byte verification are reported separately after GitHub Pages completes.
