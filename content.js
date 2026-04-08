(function () {
  "use strict";

  const MAX_POLL_ATTEMPTS = 30;
  const POLL_INTERVAL_MS = 1000;

  function init(pool) {
    // Will be implemented in Task 4
    console.log("[SP Counter] Board detected, initializing...");
  }

  function waitForBoard() {
    let attempts = 0;
    const interval = setInterval(function () {
      attempts++;
      const pool = document.getElementById("ghx-pool");
      if (pool) {
        clearInterval(interval);
        init(pool);
      } else if (attempts >= MAX_POLL_ATTEMPTS) {
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);
  }

  waitForBoard();
})();
