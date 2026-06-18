# Implementation Plan: To-Do List Life Dashboard

## Overview

Build a self-contained, client-side single-page application using vanilla HTML, CSS, and JavaScript. The app delivers four productivity widgets (greeting, focus timer, to-do list, quick links) in three files: `index.html`, `css/style.css`, and `js/app.js`. All user data is persisted via `localStorage`. Implementation proceeds layer by layer — structure → storage → widgets → wiring — with property-based tests validating each pure logic unit as it is introduced.

---

## Tasks

- [x] 1. Set up project structure and HTML skeleton
  - Create `index.html` at the repository root with a valid HTML5 boilerplate
  - Add a `<link>` tag referencing `css/style.css` and a `<script src="js/app.js" defer>` tag
  - Create `css/style.css` as an empty file (content added in Task 2)
  - Create `js/app.js` as an empty file (content added in Task 3 onward)
  - Add all required DOM landmarks: `#time`, `#date`, `#greeting`, `#timer-display`, `#btn-start`, `#btn-stop`, `#btn-reset`, `#task-input`, `#btn-add-task`, `#task-list`, `#link-label-input`, `#link-url-input`, `#btn-add-link`, `#links-container`
  - _Requirements: 6.2, 6.3, 6.4_

- [x] 2. Implement base CSS layout and responsive design
  - [x] 2.1 Write full stylesheet in `css/style.css`
    - Use CSS custom properties for colors and spacing to enable easy theming
    - Lay out the four widget cards in a responsive grid (CSS Grid or Flexbox)
    - Ensure the layout is usable at viewport widths from 320 px to 1920 px with no horizontal overflow
    - Style all interactive controls (buttons, inputs, checkboxes) for clear affordance
    - _Requirements: 6.4, 7.3_

- [x] 3. Implement storage helpers in `js/app.js`
  - [x] 3.1 Write `load(key)` and `save(key, data)` functions and define storage key constants
    - Define `const TASKS_KEY = "dashboard-tasks"` and `const LINKS_KEY = "dashboard-links"`
    - `load(key)`: read from `localStorage`, parse JSON, return `[]` on `null` or parse error (wrap in `try/catch`)
    - `save(key, data)`: JSON-stringify and write; wrap in `try/catch` to silently no-op when storage is unavailable
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_


- [x] 4. Implement Greeting Widget
  - [x] 4.1 Write `getGreeting(hour)` and `updateGreeting()` in `js/app.js`
    - `getGreeting(hour)`: return `"Good Morning"` (5–11), `"Good Afternoon"` (12–17), `"Good Evening"` (18–20), `"Good Night"` (0–4, 21–23)
    - `updateGreeting()`: read `new Date()`, write formatted HH:MM to `#time`, full date string to `#date`, greeting to `#greeting`
    - Call `updateGreeting()` immediately on load and set a `setInterval` every 60 000 ms
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_


- [x] 5. Implement Focus Timer
  - [x] 5.1 Write timer state and all timer functions in `js/app.js`
    - Declare `timerState = { totalSeconds: 1500, intervalId: null }`
    - Implement `formatTime(seconds)`: return zero-padded `"MM:SS"` string
    - Implement `renderTimer()`: write `formatTime(timerState.totalSeconds)` to `#timer-display`
    - Implement `tickTimer()`: decrement `totalSeconds`; call `stopTimer()` when it reaches 0
    - Implement `startTimer()`: return early if `intervalId !== null`; otherwise start interval calling `tickTimer` every 1000 ms
    - Implement `stopTimer()`: clear interval, set `intervalId` to `null`
    - Implement `resetTimer()`: call `stopTimer()`, restore `totalSeconds` to 1500, call `renderTimer()`
    - Wire `#btn-start`, `#btn-stop`, `#btn-reset` click listeners to their functions
    - Call `renderTimer()` on page load to show 25:00 immediately
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_


- [x] 6. Implement To-Do List CRUD and rendering
  - [x] 6.1 Write To-Do List state, CRUD functions, and render in `js/app.js`
    - Declare `let tasks = []`
    - Implement `loadTasks()`: call `load(TASKS_KEY)` and assign result to `tasks`
    - Implement `saveTasks()`: call `save(TASKS_KEY, tasks)`
    - Implement `addTask(text)`: validate `text.trim().length > 0`; create `{ id, text: text.trim(), completed: false }`; push; call `saveTasks()` and `renderTasks()`
    - Implement `toggleTask(id)`: find task, flip `completed`, call `saveTasks()` and `renderTasks()`
    - Implement `editTask(id, newText)`: validate `newText.trim().length > 0`; update `text`; call `saveTasks()` and `renderTasks()`
    - Implement `deleteTask(id)`: filter out the task by id, call `saveTasks()` and `renderTasks()`
    - Implement `renderTasks()`: clear `#task-list`, rebuild list items with toggle/edit/delete controls for each task in `tasks`
    - Wire `#btn-add-task` click and `#task-input` Enter-key to `addTask`
    - Call `loadTasks()` and `renderTasks()` on page load
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_


- [x] 7. Checkpoint — Ensure all tests pass
  - Run the test suite and confirm all property tests and unit tests pass. Ask the user if questions arise before continuing.

- [x] 8. Implement Quick Links CRUD and rendering
  - [x] 8.1 Write Quick Links state, CRUD functions, and render in `js/app.js`
    - Declare `let links = []`
    - Implement `loadLinks()`: call `load(LINKS_KEY)` and assign result to `links`
    - Implement `saveLinks()`: call `save(LINKS_KEY, links)`
    - Implement `addLink(label, url)`: validate both `label.trim().length > 0` and `url.trim().length > 0`; create `{ id, label: label.trim(), url: url.trim() }`; push; call `saveLinks()` and `renderLinks()`
    - Implement `deleteLink(id)`: filter out the link by id, call `saveLinks()` and `renderLinks()`
    - Implement `renderLinks()`: clear `#links-container`, rebuild a button per link that calls `window.open(link.url, "_blank")` on click, each button paired with a delete control
    - Wire `#btn-add-link` click to `addLink` reading `#link-label-input` and `#link-url-input`
    - Call `loadLinks()` and `renderLinks()` on page load
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_


- [x] 9. Wire DOMContentLoaded bootstrap and integrate all widgets
  - [x] 9.1 Write the `DOMContentLoaded` entry point in `js/app.js`
    - Add a single `document.addEventListener("DOMContentLoaded", ...)` block as the last section of `app.js`
    - Inside it, call: `loadTasks()`, `renderTasks()`, `loadLinks()`, `renderLinks()`, `updateGreeting()`, `renderTimer()`
    - Register all remaining event listeners for timer buttons, task add/edit/delete/toggle, and link add/delete
    - Verify no global-scope side effects execute before `DOMContentLoaded` fires
    - _Requirements: 3.10, 4.7, 6.3_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Run the full test suite. Verify `index.html` opens correctly via `file://` in Chrome, Firefox, Edge, and Safari with no console errors. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build
- Property-based tests use [fast-check](https://fast-check.dev/) loaded via CDN in the test harness only — it is never included in the production `index.html`
- Each property test should run a minimum of 100 iterations
- All 13 correctness properties from the design document are covered by sub-tasks 3.2–3.4, 4.2, 5.2–5.3, 6.2–6.6, 8.2–8.3
- The `load()` / `save()` helpers (Task 3.1) must be implemented before any widget that uses storage
- `app.js` uses no ES modules to remain compatible with the `file://` protocol (no CORS restrictions)
- ID generation should use `crypto.randomUUID()` with a fallback of `Date.now().toString()` for older browsers

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4", "4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "6.4", "6.5", "6.6"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["8.2", "8.3", "9.1"] }
  ]
}
```
