(function () {
  "use strict";

  var MAX_POLL_ATTEMPTS = 30;
  var POLL_INTERVAL_MS = 1000;
  var DEBOUNCE_MS = 200;

  var SELECTORS = {
    board: '[data-testid="software-board.board-area"]',
    column: '[data-testid="platform-board-kit.ui.column.draggable-column.styled-wrapper"]',
    columnName: '[data-testid="platform-board-kit.common.ui.column-header.editable-title.column-title.column-name"]',
    columnHeader: '[data-testid="platform-board-kit.common.ui.column-header.header.column-header-container"]',
    estimate: '[data-testid="software-board.common.fields.estimate-field.static.estimate-wrapper"]'
  };

  function debounce(fn, delay) {
    var timer = null;
    return function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  function update() {
    // Remove existing badges
    document.querySelectorAll("[data-sp-badge]").forEach(function (el) {
      el.remove();
    });

    var columns = document.querySelectorAll(SELECTORS.column);

    columns.forEach(function (col) {
      // Sum story points in this column
      var total = 0;
      col.querySelectorAll(SELECTORS.estimate).forEach(function (el) {
        var parsed = parseFloat(el.textContent.trim());
        if (!isNaN(parsed)) total += parsed;
      });

      // Find the column header to inject badge into
      var header = col.querySelector(SELECTORS.columnHeader);
      if (!header) return;

      var badge = document.createElement("span");
      badge.className = "sp-badge";
      badge.setAttribute("data-sp-badge", "true");
      badge.textContent = total + " SP";

      header.appendChild(badge);
    });
  }

  function init(board) {
    var observer;

    function safeUpdate() {
      if (observer) observer.disconnect();
      update();
      if (observer) observer.observe(board, { childList: true, subtree: true });
    }

    // Initial scan
    safeUpdate();

    // Watch for DOM changes (card moves, additions, removals)
    observer = new MutationObserver(debounce(safeUpdate, DEBOUNCE_MS));
    observer.observe(board, { childList: true, subtree: true });
  }

  function waitForBoard() {
    var attempts = 0;
    var interval = setInterval(function () {
      attempts++;
      var board = document.querySelector(SELECTORS.board);
      if (board) {
        clearInterval(interval);
        init(board);
      } else if (attempts >= MAX_POLL_ATTEMPTS) {
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);
  }

  waitForBoard();
})();
