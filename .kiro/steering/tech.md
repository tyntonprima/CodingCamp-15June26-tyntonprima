# Tech Stack

## Languages & Technologies

- **HTML5** — single `index.html` at the repository root
- **CSS3** — one stylesheet at `css/style.css`; uses CSS custom properties for theming
- **Vanilla JavaScript (ES6+)** — one script at `js/app.js`; no ES modules (incompatible with `file://` protocol)

## Constraints

- **No frameworks or libraries** in production (no React, Vue, jQuery, etc.)
- **No build tools** (no Webpack, Vite, Babel, npm scripts, etc.)
- **No backend or network calls** — the app must work fully offline
- Use IIFE-style closures for logical separation instead of ES modules

## Testing

- **Unit & property-based tests** use [fast-check](https://fast-check.dev/) loaded via CDN — in a separate test harness only, never in `index.html`
- Property tests run a minimum of 100 iterations each
- Tests are tagged: `Feature: todo-life-dashboard, Property N: <description>`

## Common Commands

There is no build step. To run the app:

```
# Open directly in a browser
start index.html          # Windows
open index.html           # macOS
xdg-open index.html       # Linux
```

To run tests, open the test harness HTML file in a browser (fast-check loaded via CDN script tag).

## Browser Support

Current stable releases of Chrome, Firefox, Edge, and Safari.
