# Jira Story Points Chrome Extension — Design Spec

## Overview

A Chrome extension that adds a story points badge/counter to each column header on classic Jira boards. The badge displays the total story points for all cards in that column, summed across all swimlanes.

## Scope

- **Classic Jira boards only** (company-managed projects)
  - URL patterns: `*.atlassian.net/jira/software/c/projects/*/boards/*` and `*.atlassian.net/secure/RapidBoard.jspa*`
- **DOM scraping** approach — no API calls, no authentication handling
- **Zero configuration** — auto-detects story point fields, no popup or options page

## Architecture

Minimal Chrome Manifest V3 extension with three files:

| File | Purpose |
|------|---------|
| `manifest.json` | Extension declaration, content script matching, permissions |
| `content.js` | All logic: detection, scraping, calculation, badge injection, observation |
| `styles.css` | Badge styling to match Jira's native appearance |

No popup, no background service worker, no options page.

## Story Point Detection

The content script tries multiple selectors to find story points on each `.ghx-issue` card:

1. **`.aui-badge`** — Scrum boards display story points as a badge by default
2. **`.ghx-extra-field[data-tooltip^="Story Points"]`** — Kanban boards with Story Points added to card layout
3. **`.ghx-extra-field[data-tooltip^="Story point estimate"]`** — alternate field name used in some Jira instances

For each card:
- Find the story point element using the selectors above (first match wins)
- Parse the numeric value from the element's text content
- Determine which column the card belongs to via the parent `.ghx-column[data-id]`
- Accumulate the total per column

Cards without story points (no matching element, or non-numeric value) are silently skipped.

## Badge Injection

For each column header (`.ghx-column-headers > li.ghx-column`):
- Create a `<span>` element styled as an inline pill badge
- Mark it with a `data-sp-badge` attribute for identification during cleanup/updates
- Insert it after the existing issue count in the column header
- Format: **"13 SP"** (number + "SP" suffix)
- Styling: blue background (`#4c9aff`), white text, rounded pill shape, matching Jira's native badge aesthetic
- Columns with 0 story points still show "0 SP" for consistency

## Change Detection

- Attach a `MutationObserver` to `#ghx-pool` with `{ childList: true, subtree: true }`
- Debounce recalculations by 200ms to avoid thrashing during drag-and-drop operations
- On each recalculation cycle:
  1. Remove all existing `[data-sp-badge]` elements
  2. Re-scan all `.ghx-issue` cards for story points
  3. Accumulate totals per column
  4. Inject updated badges into column headers

## Page Detection & Initialization

The content script matches all `*.atlassian.net/*` URLs. On injection:

1. Wait for `#ghx-pool` to appear in the DOM (Jira loads dynamically)
2. Use `setInterval` polling at 1-second intervals, up to 30 attempts
3. Once `#ghx-pool` is found, perform initial scan and attach the MutationObserver
4. If `#ghx-pool` never appears (not a board page), silently exit

## Column-to-Header Mapping

Classic Jira boards use `data-id` attributes on both column headers and column cells:
- Column headers: `.ghx-column-headers > li.ghx-column[data-id]`
- Column cells within swimlanes: `.ghx-columns > .ghx-column[data-id]`

Cards live inside swimlane column cells. The `data-id` attribute links a card's parent column cell to its corresponding column header, enabling correct badge placement regardless of swimlane count.

## Known Limitations

- **Card virtualization**: Jira removes off-screen cards from the DOM for performance. Columns with many cards may show undercounted totals if cards are scrolled out of view. This is a known trade-off of the DOM scraping approach.
- **Custom field names**: If story points use a non-standard field name (not "Story Points" or "Story point estimate"), the extension won't detect them.
- **Board reloads**: If Jira performs a full page reload (e.g., switching sprints), the content script re-initializes automatically via the polling mechanism.
