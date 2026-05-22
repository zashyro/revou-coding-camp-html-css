/**
 * To-Do Life Dashboard
 * app.js — all JavaScript: module objects + bootstrap
 */

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  TASKS: 'tld_tasks',
  LINKS: 'tld_links',
  THEME: 'tld_theme',
  NAME:  'tld_name',
};

// ---------------------------------------------------------------------------
// StorageModule — localStorage wrapper
// ---------------------------------------------------------------------------

const StorageModule = (() => {
  /**
   * Retrieve a value from localStorage.
   * @param {string} key
   * @param {*} fallback - returned when the key is absent or on any error
   * @returns {*} parsed value or fallback
   */
  function get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  /**
   * Persist a JSON-serialisable value to localStorage.
   * @param {string} key
   * @param {*} value
   * @returns {boolean} true on success, false on error
   */
  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove a key from localStorage.
   * @param {string} key
   * @returns {boolean} true on success, false on error
   */
  function remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  return { get, set, remove };
})();

// ---------------------------------------------------------------------------
// GreetingModule — clock, date, greeting, custom name
// ---------------------------------------------------------------------------

const GreetingModule = (() => {
  let _intervalId = null;

  /**
   * Return a time-of-day greeting based on the given hour (0–23).
   * @param {number} hour
   * @returns {string}
   */
  function _getGreeting(hour) {
    if (hour >= 5  && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    if (hour >= 18 && hour < 21) return 'Good evening';
    return 'Good night'; // 21–23 and 0–4
  }

  /**
   * Update the clock, date, and greeting message elements with the current time.
   */
  function _tick() {
    const now = new Date();

    // --- Clock: HH:MM (zero-padded) ---
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const clockEl = document.getElementById('clock');
    if (clockEl) clockEl.textContent = `${hh}:${mm}`;

    // --- Date: e.g. "Monday, 14 July 2025" ---
    const dateEl = document.getElementById('date');
    if (dateEl) {
      dateEl.textContent = new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        day:     'numeric',
        month:   'long',
        year:    'numeric',
      }).format(now);
    }

    // --- Greeting message ---
    const greetingEl = document.getElementById('greeting-message');
    if (greetingEl) {
      let greeting = _getGreeting(now.getHours());

      // Append personalised name if one is saved and valid (≤ 50 chars)
      const savedName = StorageModule.get(STORAGE_KEYS.NAME, '');
      const name = typeof savedName === 'string' ? savedName.trim() : '';
      if (name.length > 0 && name.length <= 50) {
        greeting += `, ${name}!`;
      }

      greetingEl.textContent = greeting;
    }
  }

  function init() {
    // Pre-populate the name input with any saved name
    const nameInput = document.getElementById('name-input');
    if (nameInput) {
      nameInput.value = StorageModule.get(STORAGE_KEYS.NAME, '');
    }

    // Bind the name form submit handler
    const nameForm = document.getElementById('name-form');
    if (nameForm) {
      const validationMsg = nameForm.querySelector('span.validation-msg');

      nameForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const input = document.getElementById('name-input');
        const trimmed = input ? input.value.trim() : '';

        if (trimmed.length === 0) {
          // Empty — remove saved name and clear any validation message
          StorageModule.remove(STORAGE_KEYS.NAME);
          if (validationMsg) validationMsg.textContent = '';
          _tick(); // update greeting immediately
        } else if (trimmed.length > 50) {
          // Too long — show validation message, do NOT save
          if (validationMsg) {
            validationMsg.textContent = 'Name must be 50 characters or fewer.';
          }
        } else {
          // Valid — save and clear validation message
          StorageModule.set(STORAGE_KEYS.NAME, trimmed);
          if (validationMsg) validationMsg.textContent = '';
          _tick(); // update greeting immediately
        }
      });
    }

    // Run once immediately, then start the 1-second interval
    _tick();
    _intervalId = setInterval(_tick, 1000);
  }

  return { init };
})();

// ---------------------------------------------------------------------------
// TimerModule — countdown state machine, controls, audio beep
// ---------------------------------------------------------------------------

const TimerModule = (() => {
  const DURATION = 25 * 60; // 1500 seconds
  let _remaining = DURATION;
  let _intervalId = null;
  let _running = false;

  /**
   * Format a number of seconds as a zero-padded MM:SS string.
   * @param {number} seconds
   * @returns {string} e.g. "25:00", "04:07"
   */
  function _formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  /**
   * Play a short 880 Hz beep via the Web Audio API.
   * Silently swallowed if AudioContext is unavailable.
   */
  function _beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.frequency.value = 880;
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (_e) {
      // AudioContext unavailable — timer still completes visually
    }
  }

  /**
   * Called every second while the timer is running.
   * Decrements _remaining, updates the display, and triggers completion.
   */
  function _tick() {
    _remaining--;
    const display = document.getElementById('timer-display');
    if (display) {
      display.textContent = _formatTime(_remaining);
    }
    if (_remaining <= 0) {
      _stop();
      _onComplete();
    }
  }

  /**
   * Show the completion message and play the beep.
   */
  function _onComplete() {
    const msg = document.getElementById('timer-complete-msg');
    if (msg) {
      msg.style.display = 'block';
    }
    _beep();
  }

  /**
   * Enable or disable the Start/Stop buttons based on running state.
   * @param {boolean} running
   */
  function _setButtonStates(running) {
    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    if (startBtn) startBtn.disabled = running;
    if (stopBtn)  stopBtn.disabled  = !running;
  }

  /**
   * Start the countdown. No-op if already running.
   */
  function _start() {
    if (_running) return;
    _running = true;
    const msg = document.getElementById('timer-complete-msg');
    if (msg) msg.style.display = 'none';
    _intervalId = setInterval(_tick, 1000);
    _setButtonStates(true);
  }

  /**
   * Stop (pause) the countdown.
   */
  function _stop() {
    clearInterval(_intervalId);
    _intervalId = null;
    _running = false;
    _setButtonStates(false);
  }

  /**
   * Stop the timer and reset remaining time to DURATION.
   */
  function _reset() {
    _stop();
    _remaining = DURATION;
    const display = document.getElementById('timer-display');
    if (display) display.textContent = _formatTime(DURATION);
    const msg = document.getElementById('timer-complete-msg');
    if (msg) msg.style.display = 'none';
  }

  return {
    init() {
      // Render initial display
      const display = document.getElementById('timer-display');
      if (display) display.textContent = _formatTime(DURATION);

      // Bind controls
      const startBtn = document.getElementById('timer-start');
      const stopBtn  = document.getElementById('timer-stop');
      const resetBtn = document.getElementById('timer-reset');
      if (startBtn) startBtn.addEventListener('click', _start);
      if (stopBtn)  stopBtn.addEventListener('click',  _stop);
      if (resetBtn) resetBtn.addEventListener('click', _reset);

      // Set initial button states (not running)
      _setButtonStates(false);
    },
  };
})();

// ---------------------------------------------------------------------------
// TodoModule — add, edit, delete, complete, sort, persistence
// ---------------------------------------------------------------------------

const TodoModule = (() => {
  let _tasks = [];
  let _sort  = 'default'; // 'default' | 'alpha' | 'status'

  /**
   * Generate a unique ID using crypto.randomUUID() with a timestamp-based fallback.
   * @returns {string}
   */
  function _uid() {
    try {
      return crypto.randomUUID();
    } catch {
      return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
  }

  /**
   * Persist the current _tasks array to localStorage.
   */
  function _save() {
    StorageModule.set(STORAGE_KEYS.TASKS, _tasks);
  }

  /**
   * Return a shallow copy of _tasks sorted according to the current _sort value.
   * The original _tasks array is never mutated.
   * @returns {Task[]}
   */
  function _sortedTasks() {
    const copy = [..._tasks];
    if (_sort === 'alpha') {
      return copy.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
    }
    if (_sort === 'status') {
      // Incomplete tasks first (false=0 before true=1)
      return copy.sort((a, b) => Number(a.completed) - Number(b.completed));
    }
    // 'default' — preserve insertion order
    return copy;
  }

  /**
   * Re-render the #todo-list from the current _tasks state.
   * Each <li> contains a complete button, task name span, edit button, and delete button.
   */
  function _render() {
    const list = document.getElementById('todo-list');
    if (!list) return;

    // Clear existing items
    list.innerHTML = '';

    _sortedTasks().forEach((task) => {
      const li = document.createElement('li');
      li.dataset.id = task.id;
      if (task.completed) li.classList.add('completed');

      // Complete / toggle button
      const completeBtn = document.createElement('button');
      completeBtn.dataset.action = 'complete';
      completeBtn.classList.add('btn-complete');
      if (task.completed) completeBtn.classList.add('completed');
      completeBtn.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
      completeBtn.textContent = task.completed ? '✓' : '○';

      // Task name span
      const nameSpan = document.createElement('span');
      nameSpan.classList.add('task-name');
      if (task.completed) {
        nameSpan.classList.add('completed');
        nameSpan.style.textDecoration = 'line-through';
      }
      nameSpan.textContent = task.name;

      // Edit button
      const editBtn = document.createElement('button');
      editBtn.dataset.action = 'edit';
      editBtn.className = 'btn';
      editBtn.textContent = 'Edit';

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.dataset.action = 'delete';
      deleteBtn.className = 'btn btn-danger';
      deleteBtn.textContent = 'Delete';

      li.appendChild(completeBtn);
      li.appendChild(nameSpan);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);

      list.appendChild(li);
    });
  }

  /**
   * Validate and add a new task.
   * Shows an inline validation message on failure; on success persists and re-renders.
   * @param {string} name
   */
  function _addTask(name) {
    const trimmed = name.trim();
    const form = document.getElementById('todo-form');
    const validationMsg = form ? form.querySelector('.validation-msg') : null;

    if (!trimmed) {
      if (validationMsg) validationMsg.textContent = 'Task name is required.';
      return;
    }
    if (trimmed.length > 200) {
      if (validationMsg) validationMsg.textContent = 'Task name must be 200 characters or fewer.';
      return;
    }

    _tasks.push({ id: _uid(), name: trimmed, completed: false, createdAt: Date.now() });
    _save();
    _render();

    // Clear input and validation message on success
    const input = document.getElementById('todo-input');
    if (input) input.value = '';
    if (validationMsg) validationMsg.textContent = '';
  }

  /**
   * Flip the completed status of a task by id, then persist and re-render.
   * @param {string} id
   */
  function _toggleTask(id) {
    const task = _tasks.find((t) => t.id === id);
    if (task) task.completed = !task.completed;
    _save();
    _render();
  }

  /**
   * Remove a task by id, then persist and re-render.
   * @param {string} id
   */
  function _deleteTask(id) {
    _tasks = _tasks.filter((t) => t.id !== id);
    _save();
    _render();
  }

  /**
   * Validate and update a task's name by id.
   * Calls _render() to restore the original display on invalid input.
   * @param {string} id
   * @param {string} newName
   */
  function _editTask(id, newName) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed.length > 200) {
      _render();
      return;
    }
    const task = _tasks.find((t) => t.id === id);
    if (task) task.name = trimmed;
    _save();
    _render();
  }

  /**
   * Replace the task name span with an inline text input for editing.
   * Saves on Enter or blur; cancels (restores display) on Escape.
   * @param {string} id
   */
  function _startEdit(id) {
    const list = document.getElementById('todo-list');
    if (!list) return;

    const li = list.querySelector(`[data-id="${id}"]`);
    if (!li) return;

    const nameSpan = li.querySelector('.task-name');
    if (!nameSpan) return;

    const currentName = nameSpan.textContent;

    // Build the inline input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'task-edit-input';

    // Replace the span with the input
    li.replaceChild(input, nameSpan);
    input.focus();

    // Flag to prevent blur from firing after Enter/Escape already handled it
    let committed = false;

    function commit() {
      if (committed) return;
      committed = true;
      _editTask(id, input.value);
    }

    function cancel() {
      if (committed) return;
      committed = true;
      _render();
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        cancel();
      }
    });

    input.addEventListener('blur', () => {
      commit();
    });
  }

  return {
    init() {
      // Load persisted tasks
      _tasks = StorageModule.get(STORAGE_KEYS.TASKS, []);

      // Bind form submit — add a new task
      const form = document.getElementById('todo-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = document.getElementById('todo-input');
          _addTask(input ? input.value : '');
        });
      }

      // Bind sort control — re-render on change
      const sortSelect = document.getElementById('sort-select');
      if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
          _sort = e.target.value;
          _render();
        });
      }

      // Delegated click on #todo-list for complete / delete / edit actions
      const todoList = document.getElementById('todo-list');
      if (todoList) {
        todoList.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-action]');
          if (!btn) return;
          const id = btn.closest('[data-id]').dataset.id;
          const action = btn.dataset.action;
          if (action === 'complete') _toggleTask(id);
          if (action === 'delete')   _deleteTask(id);
          if (action === 'edit')     _startEdit(id);
        });
      }

      _render();
    },
  };
})();

// ---------------------------------------------------------------------------
// QuickLinksModule — add, delete, URL validation, persistence
// ---------------------------------------------------------------------------

const QuickLinksModule = (() => {
  let _links = [];

  /**
   * Generate a unique ID using crypto.randomUUID() with a fallback.
   * @returns {string}
   */
  function _uid() {
    try {
      return crypto.randomUUID();
    } catch {
      return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
  }

  /**
   * Validate that a string is an absolute http:// or https:// URL.
   * @param {string} str
   * @returns {boolean}
   */
  function _isValidUrl(str) {
    try {
      const u = new URL(str);
      return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.length > 0;
    } catch {
      return false;
    }
  }

  /** Persist _links to localStorage. */
  function _save() {
    StorageModule.set(STORAGE_KEYS.LINKS, _links);
  }

  /**
   * Re-render the #link-grid from the current _links array.
   * Each link is an <a> styled as a button with a nested delete button.
   */
  function _render() {
    const grid = document.getElementById('link-grid');
    if (!grid) return;

    // Clear existing content
    grid.innerHTML = '';

    _links.forEach((link) => {
      // Outer anchor — opens link in new tab
      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'link-btn';

      // Label text node
      const labelSpan = document.createElement('span');
      labelSpan.textContent = link.label;
      a.appendChild(labelSpan);

      // Delete button
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn btn-danger';
      delBtn.setAttribute('data-action', 'delete');
      delBtn.setAttribute('data-id', link.id);
      delBtn.setAttribute('aria-label', `Delete link: ${link.label}`);
      delBtn.textContent = '✕';
      a.appendChild(delBtn);

      grid.appendChild(a);
    });
  }

  /**
   * Validate inputs and add a new link.
   * Shows inline validation messages on failure; on success persists and re-renders.
   * @param {string} label
   * @param {string} url
   */
  function _addLink(label, url) {
    const trimmedLabel = label.trim();
    const trimmedUrl   = url.trim();

    const form = document.getElementById('link-form');
    const validationSpans = form ? form.querySelectorAll('.validation-msg') : [];
    const labelMsg = validationSpans[0] || null;
    const urlMsg   = validationSpans[1] || null;

    // Clear previous messages
    if (labelMsg) labelMsg.textContent = '';
    if (urlMsg)   urlMsg.textContent   = '';

    let valid = true;

    // Validate label
    if (trimmedLabel.length === 0) {
      if (labelMsg) labelMsg.textContent = 'Label is required.';
      valid = false;
    } else if (trimmedLabel.length > 100) {
      if (labelMsg) labelMsg.textContent = 'Label must be 100 characters or fewer.';
      valid = false;
    }

    // Validate URL
    if (!_isValidUrl(trimmedUrl)) {
      if (urlMsg) urlMsg.textContent = 'Please enter a valid http:// or https:// URL.';
      valid = false;
    }

    // Check link cap
    if (valid && _links.length >= 50) {
      if (urlMsg) urlMsg.textContent = 'Maximum of 50 links reached. Delete one to add more.';
      valid = false;
    }

    if (!valid) return;

    // All good — persist
    _links.push({ id: _uid(), label: trimmedLabel, url: trimmedUrl });
    _save();
    _render();

    // Clear inputs
    const labelInput = document.getElementById('link-label-input');
    const urlInput   = document.getElementById('link-url-input');
    if (labelInput) labelInput.value = '';
    if (urlInput)   urlInput.value   = '';
  }

  /**
   * Remove a link by id, then persist and re-render.
   * @param {string} id
   */
  function _deleteLink(id) {
    _links = _links.filter((link) => link.id !== id);
    _save();
    _render();
  }

  return {
    init() {
      // Detect localStorage availability
      const storageOk = StorageModule.set(STORAGE_KEYS.LINKS, StorageModule.get(STORAGE_KEYS.LINKS, []));

      if (!storageOk) {
        // Show error banner inside the widget
        const widget = document.getElementById('links-widget');
        if (widget) {
          const banner = document.createElement('p');
          banner.className = 'error-msg';
          banner.textContent = 'Storage is unavailable. Links cannot be saved in this session.';
          widget.appendChild(banner);
        }
      }

      // Load persisted links
      _links = StorageModule.get(STORAGE_KEYS.LINKS, []);

      // Bind form submit
      const form = document.getElementById('link-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const labelInput = document.getElementById('link-label-input');
          const urlInput   = document.getElementById('link-url-input');
          _addLink(
            labelInput ? labelInput.value : '',
            urlInput   ? urlInput.value   : ''
          );
        });
      }

      // Delegated click on #link-grid for delete actions
      const grid = document.getElementById('link-grid');
      if (grid) {
        grid.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-action="delete"]');
          if (!btn) return;
          // Prevent the parent <a> from navigating
          e.preventDefault();
          const id = btn.dataset.id;
          if (id) _deleteLink(id);
        });
      }

      _render();
    },
  };
})();

// ---------------------------------------------------------------------------
// ThemeModule — toggle, persist, apply on load
// ---------------------------------------------------------------------------

const ThemeModule = (() => {
  /**
   * Apply a theme by setting the data-theme attribute on <html> and updating
   * the toggle button's accessible label and icon.
   * @param {'light'|'dark'} theme
   */
  function _apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      if (theme === 'dark') {
        btn.textContent = '☀️ Light Mode';
        btn.setAttribute('aria-label', 'Switch to light mode');
      } else {
        btn.textContent = '🌙 Dark Mode';
        btn.setAttribute('aria-label', 'Switch to dark mode');
      }
    }
  }

  return {
    init() {
      // Restore saved preference (default: 'light') — runs before any other
      // module so the correct theme is applied before widgets render.
      const saved = StorageModule.get(STORAGE_KEYS.THEME, 'light');
      _apply(saved);

      const btn = document.getElementById('theme-toggle');
      if (btn) {
        btn.addEventListener('click', () => {
          const current = document.documentElement.getAttribute('data-theme');
          const next = current === 'dark' ? 'light' : 'dark';
          _apply(next);
          StorageModule.set(STORAGE_KEYS.THEME, next);
        });
      }
    },
  };
})();

// ---------------------------------------------------------------------------
// App — bootstrap: initialise all modules in dependency order
// ---------------------------------------------------------------------------

const App = {
  init() {
    ThemeModule.init();       // first — prevents theme flash
    GreetingModule.init();
    TimerModule.init();
    TodoModule.init();
    QuickLinksModule.init();
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
