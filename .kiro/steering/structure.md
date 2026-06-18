# Project Structure

```
/
├── index.html          # Single entry point — all markup and widget skeletons
├── css/
│   └── style.css       # All styles — layout, theming, responsive design
├── js/
│   └── app.js          # All application logic — exactly one JS file
└── .kiro/
    ├── specs/
    │   └── todo-life-dashboard/   # Feature spec (requirements, design, tasks)
    └── steering/                  # AI assistant guidance files
```

## Rules

- **Exactly one CSS file** at `css/style.css` — do not add additional stylesheets
- **Exactly one JS file** at `js/app.js` — do not split into modules or add other scripts
- No `node_modules`, `package.json`, or any build artifacts belong in this repo

## app.js Internal Organization

Sections must appear in this order, separated by clear comments:

1. **Constants** — `TASKS_KEY`, `LINKS_KEY`
2. **Storage helpers** — `load(key)`, `save(key, data)`
3. **Greeting widget** — `getGreeting(hour)`, `updateGreeting()`
4. **Focus Timer** — `timerState`, `formatTime()`, `renderTimer()`, `tickTimer()`, `startTimer()`, `stopTimer()`, `resetTimer()`
5. **To-Do List** — `tasks[]`, `loadTasks()`, `saveTasks()`, `addTask()`, `toggleTask()`, `editTask()`, `deleteTask()`, `renderTasks()`
6. **Quick Links** — `links[]`, `loadLinks()`, `saveLinks()`, `addLink()`, `deleteLink()`, `renderLinks()`
7. **Bootstrap** — single `DOMContentLoaded` listener wiring everything together

No side effects should execute before the `DOMContentLoaded` listener fires.

## DOM ID Conventions

All widget DOM targets use kebab-case IDs:

| ID | Widget |
|---|---|
| `#time`, `#date`, `#greeting` | Greeting widget |
| `#timer-display`, `#btn-start`, `#btn-stop`, `#btn-reset` | Focus Timer |
| `#task-input`, `#btn-add-task`, `#task-list` | To-Do List |
| `#link-label-input`, `#link-url-input`, `#btn-add-link`, `#links-container` | Quick Links |

## Data Models

```js
// localStorage key: "dashboard-tasks"
Task  = { id: string, text: string, completed: boolean }

// localStorage key: "dashboard-links"
Link  = { id: string, label: string, url: string }
```

IDs are generated with `crypto.randomUUID()`, falling back to `Date.now().toString()`.
