# Jira Story Points Chrome Extension — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension that displays total story points per column on classic Jira boards.

**Architecture:** A Manifest V3 content script injected on Atlassian pages. It polls for the board container, scrapes story points from card elements, sums per column, and injects badge elements into column headers. A MutationObserver keeps badges updated as cards move.

**Tech Stack:** Chrome Extension Manifest V3, vanilla JavaScript, CSS

---

## File Structure

| File | Responsibility |
|------|---------------|
| `manifest.json` | Extension metadata, content script registration, URL matching |
| `content.js` | Board detection, story point scraping, badge injection, MutationObserver |
| `styles.css` | Badge pill styling |

---

### Task 1: Extension Scaffold — manifest.json

**Files:**
- Create: `manifest.json`

- [ ] **Step 1: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Jira Story Points Counter",
  "version": "1.0.0",
  "description": "Displays total story points per column on classic Jira boards",
  "content_scripts": [
    {
      "matches": [
        "https://*.atlassian.net/*"
      ],
      "js": ["content.js"],
      "css": ["styles.css"],
      "run_at": "document_idle"
    }
  ],
  "icons": {}
}
```

- [ ] **Step 2: Verify loadability**

Open `chrome://extensions`, enable Developer Mode, click "Load unpacked", select the project directory. Confirm no load errors (content.js and styles.css don't exist yet — that's fine, Chrome will warn but not fail).

- [ ] **Step 3: Commit**

```bash
git add manifest.json
git commit -m "feat: add manifest.json for Chrome extension scaffold"
```

---

### Task 2: Badge Styles — styles.css

**Files:**
- Create: `styles.css`

- [ ] **Step 1: Create styles.css**

```css
.sp-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 7px;
  background-color: #4c9aff;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  border-radius: 10px;
  vertical-align: middle;
  white-space: nowrap;
}
```

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "feat: add badge styles for story point counters"
```

---

### Task 3: Board Detection & Initialization — content.js (Part 1)

**Files:**
- Create: `content.js`

This task creates the content script with board detection logic. The script waits for `#ghx-pool` to appear, then calls an `init()` stub.

- [ ] **Step 1: Create content.js with board detection**

```javascript
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
```

- [ ] **Step 2: Manual test**

Load the extension in Chrome, navigate to a classic Jira board page (e.g., `https://sidelineswap.atlassian.net/jira/software/c/projects/PROD/boards/17`). Open DevTools console. Confirm `[SP Counter] Board detected, initializing...` appears within 30 seconds.

- [ ] **Step 3: Commit**

```bash
git add content.js
git commit -m "feat: add board detection with polling for #ghx-pool"
```

---

### Task 4: Story Point Scraping — content.js (Part 2)

**Files:**
- Modify: `content.js`

Add the function that scans all cards, extracts story points, and returns a map of column ID to total points.

- [ ] **Step 1: Add the scraping function**

Add above the `init` function in `content.js`:

```javascript
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
```

- [ ] **Step 2: Manual test**

Reload the extension on a Jira board. In DevTools console, run:
```javascript
// Temporarily expose for testing — the IIFE wraps it, so paste the function directly in console to test
```
Verify it returns an object with column IDs as keys and numeric totals as values. If the board has no story points configured on cards, the object will be empty — that's correct.

- [ ] **Step 3: Commit**

```bash
git add content.js
git commit -m "feat: add story point scraping from card elements"
```

---

### Task 5: Badge Injection — content.js (Part 3)

**Files:**
- Modify: `content.js`

Add the function that injects badge elements into column headers based on scraped totals.

- [ ] **Step 1: Add the badge injection function**

Add after `scrapeStoryPoints` in `content.js`:

```javascript
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
```

- [ ] **Step 2: Manual test**

Reload the extension on a Jira board. Verify that each column header now shows a blue pill badge with "X SP". If no story points are on cards, badges should show "0 SP".

- [ ] **Step 3: Commit**

```bash
git add content.js
git commit -m "feat: add badge injection into column headers"
```

---

### Task 6: MutationObserver & Wiring — content.js (Part 4)

**Files:**
- Modify: `content.js`

Wire everything together in `init()`: perform initial scan, inject badges, and attach MutationObserver for live updates.

- [ ] **Step 1: Add debounce utility and update init()**

Add above `init` in `content.js`:

```javascript
  var DEBOUNCE_MS = 200;

  function debounce(fn, delay) {
    var timer = null;
    return function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }
```

Replace the `init` function with:

```javascript
  function init(pool) {
    function update() {
      var totals = scrapeStoryPoints();
      injectBadges(totals);
    }

    // Initial scan
    update();

    // Watch for DOM changes (card moves, additions, removals)
    var observer = new MutationObserver(debounce(update, DEBOUNCE_MS));
    observer.observe(pool, { childList: true, subtree: true });
  }
```

- [ ] **Step 2: Manual test — initial load**

Reload the extension on a Jira board. Verify badges appear in column headers with correct totals.

- [ ] **Step 3: Manual test — drag and drop**

Drag a card from one column to another. Verify badges update within ~200ms to reflect the new totals.

- [ ] **Step 4: Manual test — swimlanes**

If the board has swimlanes, verify that the column header badge shows the sum across all swimlanes (not just the first one).

- [ ] **Step 5: Commit**

```bash
git add content.js
git commit -m "feat: wire up MutationObserver for live badge updates"
```

---

### Task 7: Final Integration Test

**Files:**
- No changes — testing only

- [ ] **Step 1: Full reload test**

Unload and reload the extension from `chrome://extensions`. Navigate to the Jira board. Verify:
1. Badges appear within a few seconds of page load
2. Each column shows correct story point total
3. Badge style matches the mockup (blue pill, white text, inline in header)

- [ ] **Step 2: Navigation test**

Navigate away from the board page and back. Verify badges re-appear after the board re-renders.

- [ ] **Step 3: No-board page test**

Navigate to a non-board Atlassian page (e.g., a Jira issue page). Open DevTools console. Verify no errors are logged and no badges appear.

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address issues found during integration testing"
```
