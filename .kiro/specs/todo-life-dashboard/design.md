# Design Document: To-Do List Life Dashboard

## Overview

The To-Do List Life Dashboard is a self-contained, client-side single-page application built with vanilla HTML, CSS, and JavaScript. It bundles four productivity widgets — a time/date greeting, a Pomodoro focus timer, a to-do list, and a quick-links panel — into one page that works offline straight from the filesystem (`file://` protocol) or as a browser extension.

All user data lives in the browser's `localStorage` API; there is no backend, no network calls, and no build step. The entire application ships as a single `index.html` paired with one stylesheet (`css/style.css`) and one script (`js/app.js`).

### Key Design Decisions

| Decision | Rationale |
|---|---|
| Vanilla JS only | Requirement 6.2 prohibits frameworks/libraries; also eliminates loading overhead |
| Single JS file | Requirement 6.4 mandates one file in `js/`; keeps the dependency graph trivial |
| `localStorage` only | Requirement 5.1; no server needed, works offline and on `file://` |
| No module bundler | Avoids build tooling; works by opening `index.html` directly |
| CSS custom properties | Enables easy theming while remaining pure CSS (no preprocessor) |

---

## Architecture

The app follows a simple layered architecture within a single JavaScript file:

```
┌─────────────────────────────────────────┐
│              index.html                  │  Structure & markup
├─────────────────────────────────────────┤
│            css/style.css                 │  All visual styling
├─────────────────────────────────────────┤
│             js/app.js                    │
│  ┌──────────────┬────────────────────┐  │
│  │  UI Layer    │  State / Logic     │  │
│  │  (DOM ops,   │  (data transforms, │  │
│  │   events)    │   timer, greeting) │  │
│  └──────┬───────┴────────┬───────────┘  │
│         │                │              │
│  ┌──────▼────────────────▼───────────┐  │
│  │         Storage Layer              │  │
│  │   localStorage read / write       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Module Boundaries (within app.js)

`app.js` is organized into clearly separated sections using IIFE-style closures and plain functions, giving logical separation without ES modules (which have CORS restrictions on `file://`):

1. **Storage helpers** — generic `load(key)` / `save(key, data)` wrappers around `localStorage`
2. **Greeting widget** — clock update loop
3. **Focus Timer** — countdown state machine
4. **To-Do List** — CRUD operations + render
5. **Quick Links** — CRUD operations + render
6. **Bootstrap** — `DOMContentLoaded` entry point

### Data Flow

```
User interaction
      │
      ▼
Event handler (UI Layer)
      │
      ├──▶ Mutate in-memory state array
      │
      ├──▶ Persist via save(key, state)
      │
      └──▶ Re-render affected widget
```

The entire state of each widget is always re-rendered from the in-memory array after any mutation, ensuring the DOM is always a faithful reflection of the data.

---

## Components and Interfaces

### 1. Greeting Widget

**Responsibilities:** Display current time in HH:MM, display full date, display time-based greeting.

**Key Functions:**

```js
// Returns greeting string based on 24-hour value
function getGreeting(hour: number): string
// → "Good Morning" | "Good Afternoon" | "Good Evening" | "Good Night"

// Updates #time, #date, #greeting DOM nodes; called by setInterval every 60 s
function updateGreeting(): void
```

**Greeting thresholds:**

| Hour range | Greeting |
|---|---|
| 05 – 11 | Good Morning |
| 12 – 17 | Good Afternoon |
| 18 – 20 | Good Evening |
| 21 – 04 (next day) | Good Night |

**DOM targets:** `#time`, `#date`, `#greeting`

---

### 2. Focus Timer

**Responsibilities:** 25-minute countdown with Start / Stop / Reset; MM:SS display; auto-stop at 00:00.

**State:**

```js
const timerState = {
  totalSeconds: 25 * 60, // current remaining time
  intervalId: null,       // setInterval handle, or null when stopped
};
```

**Key Functions:**

```js
function startTimer(): void   // starts interval if not already running
function stopTimer(): void    // clears interval, retains remaining time
function resetTimer(): void   // stops + restores to 25:00
function tickTimer(): void    // decrements totalSeconds; auto-stops at 0
function formatTime(seconds: number): string  // returns "MM:SS"
function renderTimer(): void  // writes formatted time to #timer-display
```

**DOM targets:** `#timer-display`, `#btn-start`, `#btn-stop`, `#btn-reset`

---

### 3. To-Do List

**Responsibilities:** Add / toggle / edit / delete tasks; persist to `localStorage`; restore on load.

**State:**

```js
// In-memory array, sourced from localStorage key "dashboard-tasks"
let tasks: Task[]  // see Data Models
```

**Key Functions:**

```js
function addTask(text: string): void        // validates, appends, saves, renders
function toggleTask(id: string): void       // flips completed flag, saves, renders
function editTask(id: string, newText: string): void  // validates, updates, saves, renders
function deleteTask(id: string): void       // removes, saves, renders
function renderTasks(): void               // full re-render of #task-list
function saveTasks(): void                 // JSON.stringify → localStorage
function loadTasks(): void                 // JSON.parse ← localStorage, fallback []
```

**Validation rule (shared by add and edit):** after `.trim()`, the string must have `length > 0`.

**DOM targets:** `#task-input`, `#btn-add-task`, `#task-list`

---

### 4. Quick Links

**Responsibilities:** Add / delete links; open URL in new tab on click; persist to `localStorage`; restore on load.

**State:**

```js
// In-memory array, sourced from localStorage key "dashboard-links"
let links: Link[]  // see Data Models
```

**Key Functions:**

```js
function addLink(label: string, url: string): void  // validates, appends, saves, renders
function deleteLink(id: string): void                // removes, saves, renders
function renderLinks(): void                         // full re-render of #links-container
function saveLinks(): void                           // JSON.stringify → localStorage
function loadLinks(): void                           // JSON.parse ← localStorage, fallback []
```

**Validation rule:** both `label.trim()` and `url.trim()` must have `length > 0`.

**DOM targets:** `#link-label-input`, `#link-url-input`, `#btn-add-link`, `#links-container`

---

### 5. Storage Helpers

```js
const TASKS_KEY = "dashboard-tasks";
const LINKS_KEY = "dashboard-links";

function load(key: string): any[]
// Reads localStorage[key], JSON.parses it; returns [] on null/parse error

function save(key: string, data: any[]): void
// JSON.stringifies data, writes to localStorage[key]; silently no-ops if unavailable
```

---

## Data Models

### Task

```js
{
  id: string,          // crypto.randomUUID() or Date.now().toString()
  text: string,        // non-empty, trimmed
  completed: boolean   // false on creation
}
```

**`localStorage` key:** `"dashboard-tasks"`
**Serialization:** `JSON.stringify(tasks)` / `JSON.parse(raw)`

---

### Link

```js
{
  id: string,    // crypto.randomUUID() or Date.now().toString()
  label: string, // non-empty, trimmed — displayed as button text
  url: string    // non-empty, trimmed — opened via window.open(url, "_blank")
}
```

**`localStorage` key:** `"dashboard-links"`
**Serialization:** `JSON.stringify(links)` / `JSON.parse(raw)`

---

### localStorage Layout

| Key | Value type | Example |
|---|---|---|
| `dashboard-tasks` | JSON string (array of Task) | `[{"id":"1","text":"Buy milk","completed":false}]` |
| `dashboard-links` | JSON string (array of Link) | `[{"id":"2","label":"GitHub","url":"https://github.com"}]` |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting correctness for every hour

*For any* integer hour in [0, 23], `getGreeting(hour)` SHALL return exactly one of `"Good Morning"`, `"Good Afternoon"`, `"Good Evening"`, or `"Good Night"`, and the returned string SHALL match the zone rule — hours 5–11 return `"Good Morning"`, hours 12–17 return `"Good Afternoon"`, hours 18–20 return `"Good Evening"`, and hours 0–4 and 21–23 return `"Good Night"`.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 2: Timer display format is always MM:SS

*For any* integer seconds value in [0, 1500], `formatTime(seconds)` SHALL return a string matching the pattern `/^\d{2}:\d{2}$/` where the minutes component equals `Math.floor(seconds / 60)` and the seconds component equals `seconds % 60`, both zero-padded to two digits.

**Validates: Requirements 2.3, 2.6**

---

### Property 3: Timer Start is idempotent when already running

*For any* timer state where the timer is already running (`intervalId !== null`), calling `startTimer()` again SHALL not create a second interval and SHALL not alter `totalSeconds`.

**Validates: Requirements 2.7**

---

### Property 4: Adding a valid task grows the list by exactly one

*For any* existing task list and any non-empty, non-whitespace-only text string, calling `addTask(text)` SHALL produce a list whose length is exactly `original.length + 1`, and the new item SHALL have the trimmed text as its `text` field and `completed === false`.

**Validates: Requirements 3.2**

---

### Property 5: Empty or whitespace-only text is rejected for both add and edit

*For any* string where `string.trim() === ""` (including the empty string and all-whitespace strings), calling `addTask(text)` SHALL leave the task list length unchanged, and calling `editTask(id, text)` on any existing task SHALL leave that task's `text` field unchanged.

**Validates: Requirements 3.3, 3.7**

---

### Property 6: Toggle completion state is its own inverse

*For any* task in the list, calling `toggleTask(id)` twice in succession SHALL restore the task's `completed` field to its original value.

**Validates: Requirements 3.5**

---

### Property 7: Edit updates the task's text to the new value

*For any* existing task and any valid (non-empty, non-whitespace-only) new text string, calling `editTask(id, newText)` SHALL update that task's `text` field to `newText.trim()` and leave all other tasks unchanged.

**Validates: Requirements 3.6**

---

### Property 8: Delete removes exactly the targeted task

*For any* non-empty task list, calling `deleteTask(id)` SHALL produce a list whose length is `original.length - 1` and which contains no item whose `id` equals the deleted id, while all other items remain unchanged.

**Validates: Requirements 3.8**

---

### Property 9: Task data survives a localStorage round-trip

*For any* array of Task objects, calling `save(TASKS_KEY, tasks)` followed by `load(TASKS_KEY)` SHALL return an array that is deeply equal to the original — same `id`, `text`, and `completed` values, in the same order.

**Validates: Requirements 3.9, 3.10, 5.5**

---

### Property 10: Adding a valid link grows the list by exactly one

*For any* existing links list and any label+URL pair where both `label.trim()` and `url.trim()` are non-empty, calling `addLink(label, url)` SHALL produce a list whose length is `original.length + 1` and the new item SHALL have the correct `label` and `url` fields.

**Validates: Requirements 4.2**

---

### Property 11: Invalid link submissions are rejected

*For any* submission where `label.trim() === ""` OR `url.trim() === ""`, calling `addLink(label, url)` SHALL leave the links list completely unchanged.

**Validates: Requirements 4.3**

---

### Property 12: Link data survives a localStorage round-trip

*For any* array of Link objects, calling `save(LINKS_KEY, links)` followed by `load(LINKS_KEY)` SHALL return an array that is deeply equal to the original — same `id`, `label`, and `url` values, in the same order.

**Validates: Requirements 4.6, 4.7, 5.5**

---

### Property 13: `load()` always returns an array regardless of storage state

*For any* `localStorage` state — including a missing key (returns `null`), an empty string, or a value containing invalid JSON — `load(key)` SHALL return a value for which `Array.isArray(result) === true` and SHALL never throw an exception.

**Validates: Requirements 5.4**

---

## Error Handling

| Scenario | Handling strategy |
|---|---|
| `localStorage` unavailable (private mode, storage quota exceeded) | `save()` wraps write in `try/catch`, silently no-ops; in-memory state remains valid |
| Corrupt JSON in `localStorage` | `load()` wraps `JSON.parse` in `try/catch`, returns `[]` |
| `null` returned from `localStorage.getItem` | `load()` returns `[]` before attempting parse |
| Empty/whitespace task text on add | Rejected at validation layer; no DOM mutation or storage write |
| Empty/whitespace task text on edit | Rejected at validation layer; previous text restored to DOM |
| Empty label or URL on add link | Rejected at validation layer; no DOM mutation or storage write |
| Timer Start pressed while already running | `startTimer()` checks `intervalId !== null` and returns early |
| Timer reaches 00:00 | `tickTimer()` calls `stopTimer()` automatically when `totalSeconds === 0` |

---

## Testing Strategy

### Unit Tests (example-based)

Verify concrete behaviors with specific inputs:

- `getGreeting(5)` → `"Good Morning"`, `getGreeting(12)` → `"Good Afternoon"`, etc. (boundary values)
- `formatTime(0)` → `"00:00"`, `formatTime(1500)` → `"25:00"`, `formatTime(90)` → `"01:30"`
- `addTask("")` → task list length unchanged
- `addTask("   ")` → task list length unchanged
- `addTask("Buy milk")` → task list grows by 1, text is `"Buy milk"`, `completed = false`
- `editTask(id, "")` → original text preserved
- `deleteTask(id)` → id no longer present in list
- `toggleTask(id)` twice → `completed` back to original
- `load(key)` when key absent → returns `[]`
- `load(key)` when value is `"not json"` → returns `[]`
- Timer: Start → running; Stop → paused; Reset → 25:00; double-Start → still running once
- Timer: tick to 0 → auto-stops, display shows `"00:00"`

### Property-Based Tests

Property-based tests use a library such as [fast-check](https://fast-check.dev/) (imported via CDN or copied as a single file to keep the project dependency-free in production; used only in the test harness, not in the app itself). Each test runs a **minimum of 100 iterations**.

Tests are tagged with the format: **Feature: todo-life-dashboard, Property N: \<property text\>**

| Property | Generator | Assertion |
|---|---|---|
| P1: Greeting correctness by zone | `fc.integer({min:0, max:23})` | Returns correct greeting string per zone |
| P2: Timer format is MM:SS | `fc.integer({min:0, max:1500})` | Matches `/^\d{2}:\d{2}$/`, values mathematically correct |
| P3: Timer Start idempotent | Running timer state | Same intervalId, totalSeconds unchanged |
| P4: Add valid task grows list | `fc.array(taskArb)` + `fc.string().filter(s=>s.trim())` | Length +1, new item has correct text + `completed=false` |
| P5: Whitespace rejected (add & edit) | `fc.string().filter(s=>!s.trim())` | List length unchanged / task text unchanged |
| P6: Toggle is involutory | `fc.array(taskArb, {minLength:1})` | `completed` same before and after two toggles |
| P7: Edit updates text | `fc.array(taskArb, {minLength:1})` + valid text | Task text updated to trimmed value |
| P8: Delete removes target | `fc.array(taskArb, {minLength:1})` | Length −1, id absent, others unchanged |
| P9: Task round-trip via storage | `fc.array(taskArb)` | Deep equality after save→load cycle |
| P10: Add valid link grows list | `fc.array(linkArb)` + valid label+url | Length +1, new item has correct label+url |
| P11: Invalid link rejected | Empty/whitespace label or url | Links list length unchanged |
| P12: Link round-trip via storage | `fc.array(linkArb)` | Deep equality after save→load cycle |
| P13: load() always returns array | Null/missing/corrupt storage | `Array.isArray(result) === true`, no exception thrown |

### Integration / Smoke Tests

- Open `index.html` via `file://` in Chrome, Firefox, Edge, Safari — verify full render with no console errors.
- Perform a full add → toggle → edit → delete cycle; reload page; verify state is restored.
- Clear `localStorage`, reload — verify empty lists and 25:00 timer.
- Inject malformed JSON into `localStorage` key, reload — verify empty lists render without error.
- Resize viewport from 320 px to 1920 px — verify no horizontal overflow or broken layout.

### Performance Checks

- Open DevTools Performance tab, hard-reload — verify `DOMContentLoaded` fires in < 2 s offline.
- Trigger a button click, observe frame timing — verify UI update < 100 ms.
