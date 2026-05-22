# Implementation Plan: To-Do Life Dashboard

## Overview

Build a single-page, client-side productivity dashboard using plain HTML, CSS, and Vanilla JavaScript. The implementation follows a module-object pattern inside one `app.js` file, with all state persisted in `localStorage`. Tasks are ordered to build up the scaffold first, then each module in dependency order, finishing with CSS polish and full wiring.

## Tasks

- [x] 1. Project scaffold — create the three source files with boilerplate
  - [x] 1.1 Create `index.html` with full page skeleton
    - Add `<!DOCTYPE html>`, `<html lang="en" data-theme="light">`, `<head>` (charset, viewport, title, `<link>` to `css/style.css`), and `<body>` with `<script src="js/app.js" defer></script>`
    - Add `<header>` containing `.app-title` heading and `#theme-toggle` button
    - Add `<main>` with four `<section class="widget">` elements: `#greeting-widget`, `#timer-widget`, `#todo-widget`, `#links-widget`
    - Inside `#greeting-widget`: `#clock`, `#date`, `#greeting-message`, and `#name-form` (text input + save button + `<span class="validation-msg">`)
    - Inside `#timer-widget`: `#timer-display`, `#timer-controls` (Start / Stop / Reset buttons), `#timer-complete-msg` (hidden by default)
    - Inside `#todo-widget`: `#todo-form` (text input + Add button + `<span class="validation-msg">`), `#sort-control` (`<select>` with Default / A–Z / Status options), `#todo-list` (`<ul>`)
    - Inside `#links-widget`: `#link-form` (label input + URL input + Save button + two `<span class="validation-msg">`), `#link-grid` (`<div>`)
    - Add `<footer>` with a brief attribution line
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 1.2 Create `css/style.css` with empty rule blocks as placeholders
    - File must exist at `css/style.css` so the HTML `<link>` resolves without a 404
    - Add a single `/* styles go here */` comment so the file is non-empty
    - _Requirements: 9.2_

  - [x] 1.3 Create `js/app.js` with the top-level module stubs and bootstrap
    - Declare `STORAGE_KEYS` constant object with keys `TASKS`, `LINKS`, `THEME`, `NAME`
    - Declare empty IIFE stubs for `StorageModule`, `GreetingModule`, `TimerModule`, `TodoModule`, `QuickLinksModule`, `ThemeModule` — each returning an object with an `init()` no-op
    - Declare `App` object with `init()` that calls each module's `init()` in order: Theme → Greeting → Timer → Todo → QuickLinks
    - Wire `document.addEventListener('DOMContentLoaded', () => App.init())`
    - _Requirements: 9.1, 9.3_

- [x] 2. StorageModule — localStorage wrapper
  - [x] 2.1 Implement `StorageModule` in `js/app.js`
    - Implement `get(key, fallback)`: `localStorage.getItem` wrapped in try/catch; parse JSON; return `fallback` on null or error
    - Implement `set(key, value)`: `localStorage.setItem(key, JSON.stringify(value))` in try/catch; return boolean success
    - Implement `remove(key)`: `localStorage.removeItem(key)` in try/catch; return boolean success
    - _Requirements: 2.6, 4.10, 7.7, 8.6_

- [x] 3. ThemeModule — toggle, persist, apply on load
  - [x] 3.1 Implement `ThemeModule` in `js/app.js`
    - In `init()`, call `StorageModule.get(STORAGE_KEYS.THEME, 'light')` and immediately call `_apply(saved)` before any other module runs
    - `_apply(theme)` sets `document.documentElement.setAttribute('data-theme', theme)` and updates the `#theme-toggle` button's text/icon to reflect the active theme (e.g., "🌙" for light, "☀️" for dark)
    - Attach a `click` listener on `#theme-toggle` that reads the current `data-theme`, toggles to the other value, calls `_apply`, and calls `StorageModule.set(STORAGE_KEYS.THEME, next)`
    - Default to `'light'` when no preference is saved or `localStorage` is unavailable; never throw
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 4. GreetingModule — clock, date, greeting, custom name
  - [x] 4.1 Implement `_tick()` and the clock/date/greeting display
    - `_tick()` creates `new Date()`, formats `HH:MM` (zero-padded) and writes to `#clock`
    - Format the date with `Intl.DateTimeFormat(undefined, { weekday:'long', day:'numeric', month:'long', year:'numeric' })` and write to `#date`
    - Implement `_getGreeting(hour)`: return `'Good morning'` (5–11), `'Good afternoon'` (12–17), `'Good evening'` (18–20), `'Good night'` (21–23 and 0–4)
    - Read saved name from `StorageModule.get(STORAGE_KEYS.NAME, '')`, trim it; if non-empty and ≤ 50 chars, append `, {name}!` to the greeting; write full greeting to `#greeting-message`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [x] 4.2 Implement name save/validate and interval start in `init()`
    - In `init()`, pre-populate `#name-form`'s input with `StorageModule.get(STORAGE_KEYS.NAME, '')`
    - Attach `submit` listener on `#name-form`: trim value; if empty → `StorageModule.remove(STORAGE_KEYS.NAME)` and clear validation; if > 50 chars → show validation message, do NOT save; otherwise → `StorageModule.set(STORAGE_KEYS.NAME, trimmed)` and clear validation
    - After saving or removing, call `_tick()` immediately so the greeting updates without waiting for the next second
    - Call `_tick()` once, then start `setInterval(_tick, 1000)` and store the interval ID
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 5. TimerModule — countdown state machine, controls, audio beep
  - [x] 5.1 Implement timer state, `_formatTime`, `_beep`, and `_tick`
    - Declare `const DURATION = 25 * 60`, `let _remaining = DURATION`, `let _intervalId = null`, `let _running = false`
    - `_formatTime(seconds)`: return `MM:SS` zero-padded string
    - `_beep()`: create `AudioContext`, create oscillator at 880 Hz, connect to destination, start, stop after 0.4 s — wrap entirely in try/catch so a missing `AudioContext` never throws
    - `_tick()`: decrement `_remaining`, update `#timer-display`, if `_remaining <= 0` call `_stop()` then `_onComplete()`
    - `_onComplete()`: show `#timer-complete-msg`, call `_beep()`
    - _Requirements: 3.1, 3.6_

  - [x] 5.2 Implement `_start`, `_stop`, `_reset`, button state management, and `init()`
    - `_start()`: guard if `_running`; set `_running = true`; start `setInterval(_tick, 1000)`; disable Start button, enable Stop button; hide `#timer-complete-msg`
    - `_stop()`: `clearInterval(_intervalId)`; set `_running = false`; enable Start button, disable Stop button
    - `_reset()`: call `_stop()`; set `_remaining = DURATION`; update `#timer-display` to `25:00`; hide `#timer-complete-msg`
    - In `init()`: render initial `#timer-display` as `25:00`; bind Start, Stop, Reset buttons to `_start`, `_stop`, `_reset`; set initial button states (Start enabled, Stop disabled)
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.7, 3.8, 3.9_

- [x] 6. TodoModule — add, edit, delete, complete, sort, persistence
  - [x] 6.1 Implement `_uid`, `_save`, `_sortedTasks`, and `_render`
    - `_uid()`: return `crypto.randomUUID()` with `Date.now().toString(36) + Math.random().toString(36).slice(2)` as fallback
    - `_save()`: call `StorageModule.set(STORAGE_KEYS.TASKS, _tasks)`
    - `_sortedTasks()`: return a shallow copy of `_tasks` sorted by `_sort` value (`'alpha'` → `localeCompare` case-insensitive; `'status'` → incomplete first; `'default'` → insertion order)
    - `_render()`: clear `#todo-list`; for each task in `_sortedTasks()`, create an `<li data-id="{id}">` containing: a checkbox or styled complete button (`data-action="complete"`), a `<span>` with the task name (add `completed` class when done), an edit button (`data-action="edit"`), and a delete button (`data-action="delete"`)
    - If `StorageModule.get` returned an error state, render a `<p class="error-msg">` banner instead of the list
    - _Requirements: 4.1, 4.4, 4.5, 6.1, 6.2, 6.5_

  - [x] 6.2 Implement `_addTask`, `_toggleTask`, `_deleteTask`, and `_editTask`
    - `_addTask(name)`: trim; if empty → show validation message, return; if > 200 chars → show validation message, return; push `{ id: _uid(), name: trimmed, completed: false, createdAt: Date.now() }` to `_tasks`; `_save()`; `_render()`; clear input and validation
    - `_toggleTask(id)`: find task by id, flip `completed`, `_save()`, `_render()`
    - `_deleteTask(id)`: filter out task, `_save()`, `_render()`
    - `_editTask(id, newName)`: trim; if empty or > 200 chars → restore original display, return; update `task.name`, `_save()`, `_render()`
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.7, 4.8_

  - [x] 6.3 Implement inline edit flow and event delegation in `init()`
    - `_startEdit(id)`: find the `<li data-id>`, replace its name `<span>` with an `<input>` pre-filled with the current name; focus the input
    - Attach `keydown` on the inline input: `Enter` → call `_editTask(id, input.value)`; `Escape` → call `_render()` (restores original display, no storage write)
    - In `init()`: load `_tasks = StorageModule.get(STORAGE_KEYS.TASKS, [])`; attach `submit` on `#todo-form` → `_addTask`; attach `change` on `#sort-control` → update `_sort` and call `_render()`; attach delegated `click` on `#todo-list` using `e.target.closest('[data-action]')` to dispatch to `_toggleTask`, `_deleteTask`, `_startEdit`; call `_render()`
    - _Requirements: 4.6, 4.7, 4.8, 4.9, 4.10, 6.3, 6.4_

- [x] 7. QuickLinksModule — add, delete, URL validation, persistence
  - [x] 7.1 Implement `_isValidUrl`, `_save`, `_render`, `_addLink`, `_deleteLink`, and `init()`
    - `_isValidUrl(str)`: wrap `new URL(str)` in try/catch; return `true` only if `protocol` is `'http:'` or `'https:'` and `hostname.length > 0`
    - `_save()`: `StorageModule.set(STORAGE_KEYS.LINKS, _links)`
    - `_render()`: clear `#link-grid`; for each link create an `<a href="{url}" target="_blank" rel="noopener noreferrer" class="link-btn">` with the label text and a delete button (`data-action="delete" data-id="{id}"`)
    - `_addLink(label, url)`: trim both; validate label (1–100 chars) and URL; check `_links.length < 50`; on any failure show the appropriate `<span class="validation-msg">`; on success push `{ id: _uid(), label, url }`, `_save()`, `_render()`, clear inputs and validation
    - `_deleteLink(id)`: filter out, `_save()`, `_render()`
    - In `init()`: load `_links = StorageModule.get(STORAGE_KEYS.LINKS, [])`; attach `submit` on `#link-form`; attach delegated `click` on `#link-grid` for delete; call `_render()`; if `localStorage` unavailable show `<p class="error-msg">` banner
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 8. CSS — custom properties, themes, layout, widget cards, component styles
  - [x] 8.1 Add CSS custom properties and dark-theme override to `css/style.css`
    - Define all design-token custom properties in `:root`: colour palette (`--color-bg`, `--color-surface`, `--color-primary`, `--color-primary-hover`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-danger`, `--color-success`), spacing scale (`--space-xs` through `--space-xl`), typography scale (`--font-sans`, `--font-mono`, `--text-sm` through `--text-4xl`), radii (`--radius-sm/md/lg`), shadows (`--shadow-sm/md`)
    - Add `[data-theme="dark"]` block that overrides only the colour tokens with dark-palette values
    - Ensure no hard-coded colour values appear outside these two blocks
    - _Requirements: 8.2, 8.4, 9.1_

  - [x] 8.2 Add base reset, body, header, footer, and responsive grid styles
    - Add a minimal CSS reset (`*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`)
    - Style `body` with `background: var(--color-bg)`, `color: var(--color-text)`, `font-family: var(--font-sans)`, and `min-height: 100vh`
    - Style `header` with flex layout, space-between alignment, padding, and `background: var(--color-surface)` with a bottom border
    - Style `main` as a CSS Grid: single column by default; two columns at `min-width: 640px`; four columns at `min-width: 1024px` with `#todo-widget { grid-column: span 2 }`
    - Style `footer` with centred muted text
    - _Requirements: 9.5_

  - [x] 8.3 Add `.widget` card styles and all component-level styles
    - Style `.widget` as a card: `background: var(--color-surface)`, `border: 1px solid var(--color-border)`, `border-radius: var(--radius-lg)`, `padding: var(--space-lg)`, `box-shadow: var(--shadow-sm)`
    - Style `#clock` with `font-size: var(--text-4xl)` and `font-family: var(--font-mono)`
    - Style buttons: base `.btn` class with padding, border-radius, cursor, and transition; `.btn-primary` using `--color-primary`; `.btn-danger` using `--color-danger`; `[disabled]` with reduced opacity and `cursor: not-allowed`
    - Style form inputs: full-width, border, border-radius, padding, `background: var(--color-bg)`, `color: var(--color-text)`
    - Style `.validation-msg` with `color: var(--color-danger)` and `font-size: var(--text-sm)`
    - Style `.error-msg` with a visible error banner appearance
    - Style `#todo-list li` with flex layout, gap, and a bottom border; add `.completed` class that applies `text-decoration: line-through` and `color: var(--color-text-muted)`
    - Style `#link-grid` as a flex-wrap container; style `.link-btn` as pill-shaped buttons using `--color-primary`
    - Style `#timer-display` with `font-size: var(--text-4xl)` and `font-family: var(--font-mono)`
    - Style `#timer-complete-msg` with `display: none` by default; add a `.visible` utility class that sets `display: block`
    - _Requirements: 9.5_

- [x] 9. Final checkpoint — verify all modules are wired and the page is functional
  - Open `index.html` in a browser and confirm: theme toggle works and persists; clock ticks; greeting updates with saved name; timer counts down, beeps, and resets; tasks can be added, edited, deleted, completed, and sorted; links can be added and deleted; all validation messages appear correctly; no console errors on load
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` would be optional test sub-tasks — none are included here per NFR-1 (no test framework required)
- Each task references specific requirements for traceability
- `StorageModule` (task 2) must be implemented before any module that reads or writes `localStorage`
- `ThemeModule` (task 3) must be initialised first inside `App.init()` to prevent a flash of the wrong theme
- The `_uid()` helper defined in `TodoModule` (task 6.1) can be extracted to a shared utility at the top of `app.js` and reused by `QuickLinksModule`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1", "4.1", "5.1", "6.1", "7.1", "8.1"] },
    { "id": 3, "tasks": ["4.2", "5.2", "6.2", "8.2"] },
    { "id": 4, "tasks": ["6.3", "8.3"] }
  ]
}
```
