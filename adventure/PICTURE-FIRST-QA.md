# Picture-first Sneaky Unicorn — local QA

Verified 2026-10-05. 23 browser checks passed in fresh Playwright Chromium contexts using the local 8790 preview. No browser JavaScript errors were observed. Syntax checks and whitespace checks passed. Nothing was committed, pushed or deployed.

The checks cover all five picture places, keyboard/touch controls, static reduced-motion guidance, native and legacy save preservation, exact menu/portrait suspension across play/reset/win/pause/selection, both baby rescues and family carrying, bulk deposit, grouped regular jail release, permanent police capture, remembered blast aim, real collected completion, replay/next-place, portrait recovery, trusted hub return/reentry, rejected orientation locking, artwork retry, standalone offline reload and missing-cache retry. The existing café also fits the shorter hub layout and returns normally.

The enlarged launcher fills the available choice area. Each place has a distinct large theme picture: a sofa, fruit, cupcake, toybox, or spooky pumpkin. Phones use one row; larger screens use three tiles above two. Each theme uses one original sprite fitted proportionally, without a circle badge or overlapping composition. Theme artwork is loaded and stays clear of each tile’s stars and play footer. Settings use illustrated game-art buttons with a purple-and-gold frame; landscape phone settings show all five controls in one row. New transparent sound and gear sprites are documented in icons/ILLUSTRATED-UI.md and included in the standalone cache. The offline cache is now 15.0.0-pictures-3.

Standalone landscape layouts: 568×320, 667×375, 740×300, 844×390, 932×430 and 1280×720. A large desktop viewport at 1443×1338 was also checked. Additional adventure frame checks at 568×271 and 740×251 include celebration controls; primary controls are at least 44px. Safe-inset spacing was simulated. Portrait was checked at 390×844.

Evidence is in tests/picture-first/QA-RESULTS.json and the PNGs beside it. PRESERVATION.json records matching hashes of original embedded artwork/map definitions, gameplay constants and eleven canonical geometry/carry/movement functions. IMPORT-MANIFEST.json remains the historical import baseline.

This is local simulated browser evidence, not a physical iPhone or preschool child usability test. Those hands-on acceptance checks remain open. Mid-run reload persistence remains the native v15 behavior: earned progress/preferences are saved; unfinished runs survive hub reentry in the same loaded iframe, but are not newly saved across reload.
