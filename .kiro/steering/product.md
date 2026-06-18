# Product Overview

**To-Do List Life Dashboard** is a personal productivity hub delivered as a single web page (or browser extension). It requires no backend, no account, and no network connection — everything runs in the browser.

## Core Widgets

- **Greeting Widget** — displays current time (HH:MM), full date, and a time-based greeting (Good Morning / Afternoon / Evening / Night)
- **Focus Timer** — 25-minute Pomodoro-style countdown with Start, Stop, and Reset controls
- **To-Do List** — add, edit, toggle completion, and delete tasks; persisted across sessions
- **Quick Links** — save labeled buttons that open favorite URLs in a new tab; persisted across sessions

## Key Constraints

- Works offline and via the `file://` protocol (no server required)
- No frameworks, libraries, or build tools in production
- All user data stored exclusively in `localStorage` — no external calls
- Can be used as a standalone page or packaged as a browser extension
