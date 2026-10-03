# Technical Constraints / Delivery

## Current delivery target
- Browser-based top-down game.
- iPhone-friendly PWA/static web app package.
- HTTPS-hosted for reliable Safari use; opening raw HTML from Files is not the intended phone workflow.
- Offline caching may be provided via service worker.

## Controls / mobile
- Pointer Events.
- Multitouch-safe: steering finger and action-button finger can coexist.
- Large physical touch area for Rainbow Blast.
- Safe-area aware.
- Portrait and landscape should not expose huge empty black regions.

## Camera
- Follow the player with clamping to active map/room bounds.
- If the active region is smaller than the viewport in one axis, center it rather than overscrolling into void.
- Secret rooms should clamp camera to the secret-room region, not the full extended hidden world.

## Rendering
- Gameplay collision and pathing should be independent of decorative foreground imagery.
- Do not use rectangular foreground masks that visibly slice through characters or loot.
- Items should remain fully readable and not appear inside artificial hitbox squares.

## Persistence
Local-only save data is appropriate for:
- best results,
- collected treasure/stickers,
- secret treasures,
- baby rescues,
- selected costume,
- preferences.

## Safety/product scope
No ads, purchases, chat, analytics, or external links are required for the child-focused local game.
