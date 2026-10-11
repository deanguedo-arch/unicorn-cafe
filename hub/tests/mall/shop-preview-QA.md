# Rack preview repair — 2026-10-11

Source: reported rack selection glitch and duplicate check marks. Reviewed `hub/mall.js`, shared profile actions, and native touch listeners in `hub/world.js` against the existing wardrobe and illustrated assets.

Every rack selection immediately previews its clothing without writing a save. Wear and Buy explicitly commit the selected piece; Remove persists taking it off. Category selection follows the mirror. Backpack remains one tap. Favourite outfit and equipped outfit save atomically, and delayed writes reconcile a reopened panel. Native touch buttons retain callout/drag protections without suppressing WebKit clicks. Artwork, catalogue IDs, prices, ownership and native game saves are preserved.

Checks: 13 focused checks each in Chromium and WebKit with landscape touch emulation; seven profile behaviour checks; quick-switch browser regression; eight mobile resilience checks including rollback, deduplication, acknowledged earnings, touch puzzle resume/rotation and arcade prizes. Syntax and diff checks passed. Independent read-only review repeated the focused suites, atomic preset validation and WebKit sound/Return taps; no remaining ordinary regression found. Updated an outdated profile test count to distinguish 48 legacy puzzles and eight scenic additions; catalogue unchanged.

Evidence: `evidence/shop-preview/` contains four actual browser screenshots and both focused result logs. Tests use disposable browser profiles.

Visual usefulness and functionality improved: selection and mirror match, duplicate worn tick removed, previews remain free through storage-write failure. Learner effort: rack wear now explicitly follows preview; backpack switching remains one tap. Child comprehension and physical-phone acceptance remain unverified. Browser touch emulation is not actual device acceptance.

Prevention: retain a distinct second owned item and delayed-save close/reopen checks in release testing. Clicking only an already-worn starter item had allowed the broken selection flow to pass.
