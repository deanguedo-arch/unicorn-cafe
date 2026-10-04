# Rainbow Restaurant v1.2.1 — QA report

## What this release changes
This is a repair of the delivered **v1.2.0** restaurant, not a parallel game or a return to the old cooking minigame. The old restaurant image contained fixed furniture. The previous selector painted different tables/chairs over that image, creating the reported overlaps. v1.2.1 no longer loads that background: the room, kitchen/sink, chairs, table and marker are independent render elements.

The patch adds an explicit **tablecloth** stage within the same six-stage setup, with four draped cloth choices and three table shapes (12 complete table/cloth frames). The phone setup camera centres a complete preview table. Original sourcepack chairs, sofa, plants, lamp and doorway are reused; kitchen/stove/sink and cloth material come from image-generated art segmented into reusable assets. New tables are composed offline as single coherent frames, not assembled as overlapping runtime ellipses.

The nine recipes, 18 dish/variation definitions, engine lifecycle methods, original food preparation renderer and **56 existing character/food artwork files** were compared against v1.2.0 and remain byte-identical. Other code changes are limited to interior rendering, preview/binding, safe decor migration, image CORS handling for canvas thumbnails, visible furniture footprints, the darker orange table marker and version/cache metadata. The original v1.1.0/v1.2.0 downloadable files were hash-checked and not altered.

## Executed checks

| Check set | Actual coverage/result |
|---|---|
| Deterministic production engine | **13/13 passed**. All 18 food/variation combinations; free cupcake sprinkles; right/wrong dish, ingredient and table; remake; eat/clear/dirty-dish return/wash; day completion/replay; v1.1 migration; invalid saves; paths to kitchen, sink and all five table service points. |
| Chromium production interaction suite | **14/14 groups passed**, no uncaught exceptions or console errors in the successful runs. Includes a natural first customer flow, all nine recipes via real picture buttons, free sprinkles, visible pizza/soup/ice-cream states, wrong-order recovery, carry guard, dish return/washing, mouse/keyboard/touch cancellation, protected reset and storage-shim restoration. |
| Responsive layout within that suite | **24 scenes** at 320×568, 390×844, 430×932, 568×320, 844×390 and 1024×768, spanning setup/world/cooking/washing. Visible interactive controls checked for minimum 44-pixel dimensions and viewport containment. |
| Additional art/selector repair checks | **9/9 passed**: original source preservation; clean alpha and solid surfaces in all 12 frames; production draw-count invariant across **1,296 configuration states**; nine distinct floor/wall renderings; all four cloth buttons at three phone/landscape sizes; v1.2.0 decor plus partial-cook/wash migration; marker contrast; embedded standalone boot; browser error collection. |
| Safe-area simulation | **8/8 scenes passed** using injected CSS safe-area values. This is not a hardware notch test. |
| Packaged art/static checks | **5/5 groups passed**, including decoding **85/85 WebP assets**, relative entry references, no external runtime URLs/known tracker endpoints, expected semantics and manifest paths. |
| Offline service-worker harness | **9/9 passed** in Node with mocked Cache API/events and simulated network loss. Correct project-subdirectory URLs, current cache population, isolation from other app caches, query/navigation fallback and standalone SW suppression. |

The 1,296 figure is an automated production renderer/configuration check, **not** 1,296 manually played games or individually approved screenshots. The renderer is checked to draw exactly one selected table frame and two chair sprites per table. The 12 table frames and representative actual production screenshots were visually inspected. The five marker fill/white-glyph contrasts are 3.26:1, 4.07:1, 3.51:1, 4.89:1 and 3.72:1; the outer white/dark ring is approximately 10.09:1. Their rings/shapes do not change with furniture selection.

**Final package verification: 104/104 HTTP byte checks and 11/11 ZIP/source-rebuild integrity checks passed.** The standalone HTML rebuilt from the packaged source and regenerated assets byte-for-byte. Detailed results are recorded in `tests/http-results.json` and `tests/package-results.json` in the editable kit. These checks compare extracted/rebuilt bytes, ZIP CRCs, relative paths and SHA256 manifests; they are not device tests.

## Browser method and limits
Chromium **144.0.7559.96**, Playwright, Python 3.13.5 and Node 22.16.0 in the execution container. Direct navigation to the local test server was attempted and returned **ERR_BLOCKED_BY_ADMINISTRATOR**. That restriction remained in place.

The browser suite runs the exact production HTML/CSS/JavaScript using Playwright `set_content`; local packaged image bytes are fulfilled through a test route. The new standalone file is also booted with its own embedded assets. A QA flag exposes existing production state for fixtures. Some flows begin with controlled fixtures; the initial customer flow is exercised naturally. No game engine or renderer is replaced by a simulation in these Chromium interaction checks.

Browser persistence checks explicitly use a Storage-compatible in-memory shim across document recreation. Real about:blank storage denial is also exercised. Native-origin storage persistence is not claimed. Offline event/cache tests are separate Node simulations; HTTP byte checks use Python requests, not browser navigation.

**Not tested:** physical iPhone/iPad, Safari/WebKit rendering, Home Screen installation, real installed-PWA offline restart/update, hardware safe areas, speaker audibility, haptic sensation or physical multi-touch performance. No claim is made that every device behaves identically or that all future defects are excluded. Browser administration policies and project settings were not changed.

## Reproducibility and provenance
The source kit includes production code/assets, original generated/sourcepack art references, asset preparation/refinement scripts, test scripts and machine-readable results. All tablecloth/stove/sink visuals in the playable build are real local image assets; image-generation concept scenes are not passed off as screenshots of game execution. No generated customer replacements are used.
