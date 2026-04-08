# <img src="icons/icon-128.png" width="32" height="32" alt="SideScore icon" /> SideScore

A Chrome extension that displays total story points per column on Jira boards.

![Chrome](https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)

## What it does

SideScore adds a small **SP badge** to each column header on your Jira board showing the total story points for all cards in that column. Badges update automatically when you drag cards between columns.

## Installation

1. Clone or download this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer Mode** (top right)
4. Click **Load unpacked** and select the project folder

## How it works

- Detects Jira board pages on `*.atlassian.net`
- Scrapes story point estimates from card fields
- Sums points per column and injects a badge into each column header
- Uses a `MutationObserver` to keep totals updated in real time as cards move

## Supported boards

Works with Jira Cloud boards using the modern `platform-board-kit` rendering engine (the default for most Jira Cloud instances).

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension config (Manifest V3) |
| `content.js` | Board detection, scraping, badge injection |
| `styles.css` | Badge styling |

## License

MIT
