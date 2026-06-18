// ============================================================
// 1. Constants
// ============================================================
const TASKS_KEY    = "dashboard-tasks";
const LINKS_KEY    = "dashboard-links";
const THEME_KEY    = "dashboard-theme";
const NAME_KEY     = "dashboard-name";
const DURATION_KEY = "dashboard-duration";

// ============================================================
// 2. Storage Helpers
// ============================================================

/**
 * Reads and JSON-parses the value stored at `key` in localStorage.
 * Returns an empty array if the key is absent or the value is not valid JSON.
 *
 * @param {string} key
 * @returns {any[]}
 */
function load(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Reads a plain string value from localStorage. Returns null if absent.
 *
 * @param {string} key
 * @returns {string|null}
 */
function loadString(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

/**
 * JSON-stringifies `data` and writes it to localStorage under `key`.
 * Silently no-ops when storage is unavailable.
 *
 * @param {string} key
 * @param {any[]} data
 */
function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    // Storage unavailable — in-memory state remains valid; ignore silently.
  }
}

/**
 * Writes a plain string value to localStorage.
 *
 * @param {string} key
 * @param {string} value
 */
function saveString(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // silent no-op
  }
}

// ============================================================
// 3. Theme (Light / Dark)
// ============================================================

/**
 * Applies the given theme to the <html> element and updates the toggle icon.
 * Persists the choice to localStorage.
 *
 * @param {"dark"|"light"} theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  var icon = document.getElementById("theme-icon");
  if (icon) {
    icon.textContent = theme === "dark" ? "☀️" : "🌙";
  }
  saveString(THEME_KEY, theme);
}

/** Toggles between dark and light mode. */
function toggleTheme() {
  var current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
}

// ============================================================
// 4. Greeting Widget
// ============================================================

/** In-memory custom name (empty string = no name set). */
var userName = "";

/**
 * Returns a time-based greeting string for the given 24-hour value.
 *
 * | Hour range | Greeting         |
 * |------------|------------------|
 * | 05 – 11    | Good Morning     |
 * | 12 – 17    | Good Afternoon   |
 * | 18 – 20    | Good Evening     |
 * | 21 – 23,   | Good Night       |
 * | 00 – 04    |                  |
 *
 * @param {number} hour  Integer in [0, 23]
 * @returns {string}
 */
function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return "Good Morning";
  if (hour >= 12 && hour <= 17) return "Good Afternoon";
  if (hour >= 18 && hour <= 20) return "Good Evening";
  return "Good Night";
}

/**
 * Reads the current time and updates #time, #date, and #greeting.
 * Called on load and via setInterval every 60 000 ms.
 */
function updateGreeting() {
  var now = new Date();
  var hours   = String(now.getHours()).padStart(2, "0");
  var minutes = String(now.getMinutes()).padStart(2, "0");

  document.getElementById("time").textContent = hours + ":" + minutes;
  document.getElementById("date").textContent = now.toLocaleDateString(
    undefined,
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );

  var base = getGreeting(now.getHours());
  document.getElementById("greeting").textContent = userName
    ? base + ", " + userName + "!"
    : base + "!";
}

/**
 * Renders the name display row:
 *   - If a name is set: shows the name text + edit button
 *   - If no name: shows a placeholder prompt + edit button
 */
function renderName() {
  var displayEl = document.getElementById("display-name");
  if (displayEl) {
    displayEl.textContent = userName ? userName : "Set your name";
    displayEl.classList.toggle("name-placeholder", !userName);
  }
}

/**
 * Opens inline editing for the user name within #name-row.
 * Replaces the display span with an input; saves on Enter or blur.
 */
function openNameEdit() {
  var nameRow    = document.getElementById("name-row");
  var displayEl  = document.getElementById("display-name");
  var editBtnEl  = document.getElementById("btn-edit-name");

  if (!nameRow || !displayEl || !editBtnEl) return;

  // Prevent double-opening
  if (nameRow.querySelector(".name-edit-input")) return;

  var input = document.createElement("input");
  input.type = "text";
  input.className = "name-edit-input";
  input.value = userName;
  input.maxLength = 40;
  input.placeholder = "Enter your name";
  input.setAttribute("aria-label", "Your name");

  function commitName() {
    var trimmed = input.value.trim();
    userName = trimmed;
    saveString(NAME_KEY, trimmed);
    nameRow.replaceChild(displayEl, input);
    editBtnEl.style.display = "";
    renderName();
    updateGreeting();
  }

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter")  { commitName(); }
    if (e.key === "Escape") {
      nameRow.replaceChild(displayEl, input);
      editBtnEl.style.display = "";
    }
  });
  input.addEventListener("blur", commitName);

  editBtnEl.style.display = "none";
  nameRow.replaceChild(input, displayEl);
  input.focus();
  input.select();
}

// ============================================================
// 5. Focus Timer
// ============================================================

/**
 * Timer state. `baseDuration` is the configurable reset value (in seconds).
 * Defaults to 25 minutes; loaded from localStorage on startup.
 */
var timerState = {
  totalSeconds:  1500,
  baseDuration:  1500,  // what Reset restores to
  intervalId:    null
};

/**
 * Converts a total number of seconds into a zero-padded "MM:SS" string.
 *
 * @param {number} seconds  Non-negative integer
 * @returns {string}  e.g. 1500 → "25:00", 90 → "01:30", 0 → "00:00"
 */
function formatTime(seconds) {
  var mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  var ss = String(seconds % 60).padStart(2, "0");
  return mm + ":" + ss;
}

/** Writes the current timer value to #timer-display and animates the SVG ring. */
function renderTimer() {
  document.getElementById("timer-display").textContent =
    formatTime(timerState.totalSeconds);

  // Animate SVG ring: stroke-dashoffset 0 (full) → 327 (empty)
  var ring = document.getElementById("timer-ring-fill");
  if (ring) {
    var total = timerState.baseDuration > 0 ? timerState.baseDuration : 1500;
    var fraction = timerState.totalSeconds / total;
    var circumference = 327; // 2π × r52
    ring.style.strokeDashoffset = String(circumference * (1 - fraction));
  }
}

/**
 * Decrements totalSeconds by one each tick.
 * Auto-stops and renders 00:00 when the countdown reaches zero.
 */
function tickTimer() {
  timerState.totalSeconds -= 1;
  if (timerState.totalSeconds <= 0) {
    timerState.totalSeconds = 0;
    stopTimer();
  }
  renderTimer();
}

/**
 * Starts the countdown.
 * Idempotent — returns early if already running.
 */
function startTimer() {
  if (timerState.intervalId !== null) return;
  timerState.intervalId = setInterval(tickTimer, 1000);
}

/**
 * Pauses the countdown.
 * Safe to call when already stopped.
 */
function stopTimer() {
  clearInterval(timerState.intervalId);
  timerState.intervalId = null;
}

/**
 * Stops the timer, restores `baseDuration`, and updates the display.
 */
function resetTimer() {
  stopTimer();
  timerState.totalSeconds = timerState.baseDuration;
  renderTimer();
}

/**
 * Sets a new base duration from the #timer-duration-input field.
 * Validates input (1–120 minutes), persists to localStorage,
 * and resets the timer to the new duration.
 */
function setTimerDuration() {
  var input   = document.getElementById("timer-duration-input");
  var minutes = parseInt(input.value, 10);

  if (isNaN(minutes) || minutes < 1)   { minutes = 1; }
  if (minutes > 120)                    { minutes = 120; }

  input.value = minutes;
  timerState.baseDuration  = minutes * 60;
  timerState.totalSeconds  = timerState.baseDuration;
  saveString(DURATION_KEY, String(minutes));
  stopTimer();
  renderTimer();
}

// ============================================================
// 6. To-Do List
// ============================================================

/** In-memory task array. Sourced from localStorage key "dashboard-tasks". */
var tasks = [];

/** Loads tasks from localStorage. */
function loadTasks() {
  tasks = load(TASKS_KEY);
}

/** Persists the current task array to localStorage. */
function saveTasks() {
  save(TASKS_KEY, tasks);
}

/**
 * Adds a new task if `text` is non-empty after trimming.
 *
 * @param {string} text
 */
function addTask(text) {
  if (text.trim().length === 0) return;
  var id = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString();
  tasks.push({ id: id, text: text.trim(), completed: false });
  saveTasks();
  renderTasks();
}

/**
 * Flips the `completed` flag of the task with the given id.
 *
 * @param {string} id
 */
function toggleTask(id) {
  var task = tasks.find(function (t) { return t.id === id; });
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

/**
 * Updates task text. Rejects empty/whitespace values.
 *
 * @param {string} id
 * @param {string} newText
 */
function editTask(id, newText) {
  if (newText.trim().length === 0) return;
  var task = tasks.find(function (t) { return t.id === id; });
  if (!task) return;
  task.text = newText.trim();
  saveTasks();
  renderTasks();
}

/**
 * Removes the task with the given id.
 *
 * @param {string} id
 */
function deleteTask(id) {
  tasks = tasks.filter(function (t) { return t.id !== id; });
  saveTasks();
  renderTasks();
}

/** Full re-render of #task-list from the in-memory `tasks` array. */
function renderTasks() {
  var list = document.getElementById("task-list");
  list.innerHTML = "";

  // Update badge count
  var badge = document.getElementById("task-count");
  if (badge) {
    var remaining = tasks.filter(function(t) { return !t.completed; }).length;
    badge.textContent = remaining > 0 ? String(remaining) : "";
    badge.style.display = remaining > 0 ? "" : "none";
  }

  tasks.forEach(function (task) {
    var li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " completed" : "");

    // Checkbox
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", function () { toggleTask(task.id); });

    // Text span
    var span = document.createElement("span");
    span.className = "task-text";
    span.textContent = task.text;

    // Actions container
    var actions = document.createElement("div");
    actions.className = "task-actions";

    // Edit button
    var editBtn = document.createElement("button");
    editBtn.className = "btn-task-edit";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", function () {
      var editInput = document.createElement("input");
      editInput.type = "text";
      editInput.className = "task-edit-input";
      editInput.value = task.text;
      li.replaceChild(editInput, span);

      var saveBtn = document.createElement("button");
      saveBtn.className = "btn-task-save";
      saveBtn.textContent = "Save";
      saveBtn.addEventListener("click", function () { editTask(task.id, editInput.value); });

      var cancelBtn = document.createElement("button");
      cancelBtn.className = "btn-task-cancel";
      cancelBtn.textContent = "Cancel";
      cancelBtn.addEventListener("click", function () { renderTasks(); });

      actions.replaceChild(saveBtn, editBtn);
      actions.insertBefore(cancelBtn, saveBtn.nextSibling);
      editInput.focus();
    });

    // Delete button
    var deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-task-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", function () { deleteTask(task.id); });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

// ============================================================
// 7. Quick Links
// ============================================================

/** In-memory links array. Sourced from localStorage key "dashboard-links". */
var links = [];

/** Loads links from localStorage. */
function loadLinks() {
  links = load(LINKS_KEY);
}

/** Persists the current links array to localStorage. */
function saveLinks() {
  save(LINKS_KEY, links);
}

/**
 * Adds a new link if both label and url are non-empty after trimming.
 *
 * @param {string} label
 * @param {string} url
 */
function addLink(label, url) {
  if (label.trim().length === 0 || url.trim().length === 0) return;
  var id = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString();
  links.push({ id: id, label: label.trim(), url: url.trim() });
  saveLinks();
  renderLinks();
}

/**
 * Removes the link with the given id.
 *
 * @param {string} id
 */
function deleteLink(id) {
  links = links.filter(function (link) { return link.id !== id; });
  saveLinks();
  renderLinks();
}

/** Full re-render of #links-container from the in-memory `links` array. */
function renderLinks() {
  var container = document.getElementById("links-container");
  container.innerHTML = "";

  links.forEach(function (link) {
    var wrapper = document.createElement("div");
    wrapper.className = "link-item";

    var pill = document.createElement("button");
    pill.className = "link-pill";
    pill.textContent = link.label;
    pill.addEventListener("click", function () { window.open(link.url, "_blank"); });

    var deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-link-delete";
    deleteBtn.textContent = "✕";
    deleteBtn.addEventListener("click", function () { deleteLink(link.id); });

    wrapper.appendChild(pill);
    wrapper.appendChild(deleteBtn);
    container.appendChild(wrapper);
  });
}

// ============================================================
// 8. Bootstrap — DOMContentLoaded
// ============================================================
document.addEventListener("DOMContentLoaded", function () {

  // --- Inject SVG gradient for timer ring ---
  (function() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "timer-svg-defs");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = '<defs>' +
      '<linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#7c6fff"/>' +
        '<stop offset="100%" stop-color="#22d3ee"/>' +
      '</linearGradient>' +
    '</defs>';
    document.body.insertBefore(svg, document.body.firstChild);
  })();

  // --- Theme ---
  var savedTheme = loadString(THEME_KEY);
  applyTheme(savedTheme === "light" ? "light" : "dark");
  document.getElementById("btn-theme-toggle").addEventListener("click", toggleTheme);

  // --- Custom name ---
  var savedName = loadString(NAME_KEY);
  userName = (savedName !== null) ? savedName : "";
  renderName();
  document.getElementById("btn-edit-name").addEventListener("click", openNameEdit);

  // --- Timer duration ---
  var savedDuration = loadString(DURATION_KEY);
  if (savedDuration !== null) {
    var savedMinutes = parseInt(savedDuration, 10);
    if (!isNaN(savedMinutes) && savedMinutes >= 1 && savedMinutes <= 120) {
      timerState.baseDuration = savedMinutes * 60;
      timerState.totalSeconds = timerState.baseDuration;
      var durationInput = document.getElementById("timer-duration-input");
      if (durationInput) durationInput.value = savedMinutes;
    }
  }

  // --- Tasks & links ---
  loadTasks();
  renderTasks();
  loadLinks();
  renderLinks();

  // --- Initial renders ---
  updateGreeting();
  renderTimer();
  setInterval(updateGreeting, 60000);

  // --- Timer controls ---
  document.getElementById("btn-start").addEventListener("click", startTimer);
  document.getElementById("btn-stop").addEventListener("click", stopTimer);
  document.getElementById("btn-reset").addEventListener("click", resetTimer);
  document.getElementById("btn-set-duration").addEventListener("click", setTimerDuration);

  var durationInput = document.getElementById("timer-duration-input");
  durationInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") setTimerDuration();
  });

  // --- Task add ---
  var taskInput = document.getElementById("task-input");
  document.getElementById("btn-add-task").addEventListener("click", function () {
    addTask(taskInput.value);
    taskInput.value = "";
  });
  taskInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      addTask(taskInput.value);
      taskInput.value = "";
    }
  });

  // --- Link add ---
  var labelInput = document.getElementById("link-label-input");
  var urlInput   = document.getElementById("link-url-input");
  document.getElementById("btn-add-link").addEventListener("click", function () {
    addLink(labelInput.value, urlInput.value);
    labelInput.value = "";
    urlInput.value   = "";
  });
  urlInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      addLink(labelInput.value, urlInput.value);
      labelInput.value = "";
      urlInput.value   = "";
    }
  });
});
