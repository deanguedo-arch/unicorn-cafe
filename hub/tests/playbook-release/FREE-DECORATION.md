# Free bedroom placement — 2026-10-15

Requested change: decorations should go wherever she chooses, rather than fixed snapping spots.

Removed the anchor grid, occupied-position restriction and glowing target dots. The profile now retains arbitrary floor coordinates, allowing objects to overlap. Existing layouts stay in place. Room edges and the stair landing remain reserved. Dragging an already-placed decoration preserves the point where it was grabbed; tapping it selects it without moving it.

Checks: 39 shared-state checks passed. Seven focused browser checks passed in each Chromium and WebKit at 568×320, covering off-grid placement, overlapping objects, tap selection, moving a placed object without a jump, invalid drops, storage failure and reload retention. Chromium used native touch drags; WebKit used touch taps and pointer drags. The broader 11-group play flow also passed in each browser. Independent review and a native touch-cancel check found no remaining issue. The clean release package passed its checksum and background-preservation checks. Physical-phone use remains a separate check.

Prevention: retain the explicit placed-item tap and grab-offset regressions; selection and placement must not both execute for the same gesture.
