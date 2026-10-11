# Rack preview repair — 2026-10-11

Source: reported rack selection glitch and duplicate check marks. Reviewed `hub/mall.js`, shared profile actions, and native touch listeners in `hub/world.js` against the existing wardrobe and illustrated assets.

Every rack selection immediately previews its clothing without writing a save. Wear and Buy explicitly commit the selected piece; Remove persists taking it off. Category selection follows the mirror. Backpack remains one tap. Favourite outfit and equipped outfit save atomically, and delayed writes reconcile a reopened panel. Native touch buttons retain callout/drag protections without suppressing WebKit clicks. Artwork, catalogue IDs, prices, ownership and native game saves are preserved.

Checks: 15 focused checks each in Chromium and WebKit with landscape touch emulation; seven profile behaviour checks; quick-switch browser regression; eight mobile resilience checks including rollback, deduplication, acknowledged earnings, touch puzzle resume/rotation and arcade prizes. Syntax and diff checks passed. Independent read-only review repeated the focused suites, atomic preset validation and WebKit sound/Return taps; no remaining ordinary regression found. Updated an outdated profile test count to distinguish 48 legacy puzzles and eight scenic additions; catalogue unchanged.

Evidence: `evidence/shop-preview/` contains eight actual browser screenshots and both focused result logs. Tests use disposable browser profiles.

Visual usefulness and functionality improved: selection and mirror match, duplicate worn tick removed, previews remain free through storage-write failure. Learner effort: rack wear now explicitly follows preview; backpack switching remains one tap. Child comprehension and physical-phone acceptance remain unverified. Browser touch emulation is not actual device acceptance.

Prevention: retain a distinct second owned item and delayed-save close/reopen checks in release testing. Clicking only an already-worn starter item had allowed the broken selection flow to pass.

Concurrent upstream integration: preserved `d5d6efc` café helpers, lunch exploration, home scenes and in-world boutique displays. Shelf decision now has a fitted large mirror, slot-picture Wear action and no duplicate check marks. Both focused engines cover real shelf taps, free unaffordable trials, put-back and small-phone card bounds. The upstream four-changes browser suite passed all 25 grouped checks after integration, including café/home and rack transactions.

Final independent review found action-row overflow on small screens and a clipped card on short landscape screens. Repaired separate mirror/card sizing and short-height positioning. Focused checks now require all price/buttons/mirror bounds inside the card and card below the top controls at 568×320 and 740×251/281/300; both engines passed.
