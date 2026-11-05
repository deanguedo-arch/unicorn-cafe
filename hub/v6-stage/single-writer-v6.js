/* Hold one browser lock for the lifetime of the game page.
   Park construction reads all three sports stores, so acquire before boot. */
(function (root) {
  'use strict';
  function cover(message, retry) {
    const overlay = document.createElement('div');
    overlay.id = 'v6-writer-blocked';
    overlay.setAttribute('role', 'alert');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:20000;display:grid;place-content:center;gap:1rem;padding:2rem;background:#503a63;color:#fff6dc;text-align:center;font:600 18px system-ui,sans-serif';
    const text = document.createElement('p'); text.textContent = message; overlay.append(text);
    if (retry) {
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = 'Try again'; button.onclick = () => location.reload(); overlay.append(button);
    }
    document.body.append(overlay);
  }
  function start(name, boot) {
    if (!navigator.locks || typeof navigator.locks.request !== 'function') {
      cover('This game cannot protect its saves in this browser. Open it in a browser with Web Locks support.', false);
      return;
    }
    // A restored page must reacquire the lock before using any cached state.
    window.addEventListener('pageshow', event => {
      if (event.persisted) { cover('Reopening the game safely…', false); location.reload(); }
    });
    try {
      navigator.locks.request(name, {mode: 'exclusive', ifAvailable: true}, lock => {
        if (!lock) {
          cover('This game is already open in another tab. Close that tab, then try again. Your saves are unchanged.', true);
          return;
        }
        // Keep the lock even if initialization throws: partially installed
        // listeners must never outlive the lock and write stale state.
        try { boot(); } catch (_) {
          cover('The game could not finish starting. Close this page and try again.', false);
        }
        // Browser releases the lock on document destruction, refresh or crash.
        return new Promise(() => {});
      }).catch(() => cover('The game could not protect its saves. Close this page and try again.', false));
    } catch (_) {
      cover('The game could not protect its saves. Close this page and try again.', false);
    }
  }
  root.UWSingleWriterV6 = {start};
})(window);
