(function () {
  "use strict";

  const MAX_POLL_ATTEMPTS = 30;
  const POLL_INTERVAL_MS = 1000;

  var SP_SELECTORS = [
    ".aui-badge",
    '.ghx-extra-field[data-tooltip^="Story Points"]',
    '.ghx-extra-field[data-tooltip^="Story point estimate"]'
  ];

  function scrapeStoryPoints() {
    var columnTotals = {};
    var cards = document.querySelectorAll("#ghx-pool .ghx-issue");

    cards.forEach(function (card) {
      var points = null;

      for (var i = 0; i < SP_SELECTORS.length; i++) {
        var el = card.querySelector(SP_SELECTORS[i]);
        if (el) {
          var parsed = parseFloat(el.textContent.trim());
          if (!isNaN(parsed)) {
            points = parsed;
            break;
          }
        }
      }

      if (points === null) return;

      var column = card.closest(".ghx-column");
      if (!column) return;

      var columnId = column.getAttribute("data-id") || column.getAttribute("data-column-id");
      if (!columnId) return;

      columnTotals[columnId] = (columnTotals[columnId] || 0) + points;
    });

    return columnTotals;
  }

  function injectBadges(columnTotals) {
    // Remove existing badges
    document.querySelectorAll("[data-sp-badge]").forEach(function (el) {
      el.remove();
    });

    var headers = document.querySelectorAll("#ghx-column-headers .ghx-column");

    headers.forEach(function (header) {
      var columnId = header.getAttribute("data-id") || header.getAttribute("data-column-id");
      if (!columnId) return;

      var total = columnTotals[columnId] || 0;

      var badge = document.createElement("span");
      badge.className = "sp-badge";
      badge.setAttribute("data-sp-badge", "true");
      badge.textContent = total + " SP";

      // Insert into the header — find the heading element or append to header
      var heading = header.querySelector("h2") || header.querySelector(".ghx-column-title");
      if (heading) {
        heading.appendChild(badge);
      } else {
        header.appendChild(badge);
      }
    });
  }

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
