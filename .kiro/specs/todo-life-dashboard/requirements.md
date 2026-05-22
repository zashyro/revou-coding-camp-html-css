# Requirements Document

## Introduction

The To-Do Life Dashboard is a client-side web application built with HTML, CSS, and Vanilla JavaScript. It provides users with a personal productivity hub that displays the current time and date, a greeting, a Pomodoro-style focus timer, a to-do list, and a quick-links panel. All data is persisted in the browser's Local Storage — no backend or server is required. The dashboard also supports light/dark theme toggling, a customizable user name in the greeting, and task sorting.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI section that displays the current time, date, and a personalized greeting message.
- **Focus_Timer**: The Pomodoro-style countdown timer widget.
- **Todo_List**: The widget that manages the user's task items.
- **Task**: A single to-do item stored in Local Storage.
- **Quick_Links**: The widget that displays user-defined shortcut buttons to external websites.
- **Link**: A single quick-link entry containing a label and a URL.
- **Theme_Toggle**: The control that switches the Dashboard between light and dark visual themes.
- **Local_Storage**: The browser's `localStorage` API used for all client-side data persistence.
- **Sort_Control**: The UI control that changes the display order of Tasks in the Todo_List.
- **User_Name**: The custom name entered by the user, displayed in the greeting.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a personalized greeting, so that I feel welcomed and oriented when I open the dashboard.

#### Acceptance Criteria

1. WHILE the Dashboard is open, THE Greeting_Widget SHALL update the displayed time once per second using the device's local clock, formatted as HH:MM (24-hour, zero-padded).
2. THE Greeting_Widget SHALL display the current date in a human-readable format (e.g., "Monday, 14 July 2025") derived from the device's local clock.
3. WHEN the local hour is between 05:00 and 11:59, THE Greeting_Widget SHALL display the message "Good morning".
4. WHEN the local hour is between 12:00 and 17:59, THE Greeting_Widget SHALL display the message "Good afternoon".
5. WHEN the local hour is between 18:00 and 20:59, THE Greeting_Widget SHALL display the message "Good evening".
6. WHEN the local hour is between 21:00 and 23:59, or between 00:00 and 04:59, THE Greeting_Widget SHALL display the message "Good night".
7. WHERE a User_Name has been saved and contains at least one non-whitespace character, THE Greeting_Widget SHALL append the User_Name to the greeting (e.g., "Good morning, Alex!"), with the User_Name truncated to 50 characters if longer.
8. WHERE no User_Name has been saved, THE Greeting_Widget SHALL display the greeting without a name suffix.
9. WHEN the saved User_Name consists entirely of whitespace characters, THE Greeting_Widget SHALL treat it as no name saved and display the greeting without a name suffix.

---

### Requirement 2: Custom Name in Greeting (Challenge)

**User Story:** As a user, I want to set my name so that the greeting addresses me personally.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an input field and a save button that allow the user to enter and save a User_Name.
2. WHEN the user submits a non-empty User_Name of 1–50 characters, THE Dashboard SHALL persist the User_Name in Local_Storage.
3. WHEN the user submits a User_Name exceeding 50 characters, THE Dashboard SHALL NOT persist the value and SHALL display an inline validation message indicating the character limit.
4. WHEN the user submits an empty string as the User_Name, THE Dashboard SHALL remove the User_Name from Local_Storage and display the greeting without a name suffix.
5. WHEN the Dashboard loads, THE Dashboard SHALL read the User_Name from Local_Storage and display it in the greeting within 500 ms, and SHALL pre-populate the name input field with the saved value.
6. IF Local_Storage is unavailable, THEN THE Dashboard SHALL display the greeting without a name suffix and SHALL NOT throw an unhandled error.

---

### Requirement 3: Focus Timer

**User Story:** As a user, I want a countdown focus timer, so that I can work in focused intervals and take breaks.

#### Acceptance Criteria

1. WHILE the Focus_Timer is running, THE Focus_Timer SHALL update the displayed countdown once per second in MM:SS format (zero-padded minutes and seconds).
2. WHEN the Dashboard loads, THE Focus_Timer SHALL initialize to 25 minutes (25:00) by default.
3. WHEN the user activates the Start button, THE Focus_Timer SHALL begin counting down one second per second.
4. WHEN the user activates the Stop button while the Focus_Timer is running, THE Focus_Timer SHALL pause the countdown and preserve the remaining time exactly as-is.
5. WHEN the user activates the Reset button, THE Focus_Timer SHALL stop any active countdown and restore the display to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically, display 00:00, show a visible on-page completion message, and play an audible beep to notify the user.
7. WHILE the Focus_Timer is running, THE Focus_Timer SHALL disable the Start button and enable the Stop button.
8. WHILE the Focus_Timer is stopped, paused, or completed, THE Focus_Timer SHALL enable the Start button and disable the Stop button.
9. IF the Focus_Timer is paused and the user activates the Start button, THEN THE Focus_Timer SHALL resume counting down from the preserved remaining time, not from 25:00.

---

### Requirement 4: To-Do List

**User Story:** As a user, I want to manage a list of tasks, so that I can track what I need to do and mark progress.

#### Acceptance Criteria

1. THE Todo_List SHALL provide an input field and an add button that allow the user to create a new Task.
2. WHEN the user submits a task name of 1–200 characters, THE Todo_List SHALL add the Task to the list and persist all Tasks to Local_Storage.
3. WHEN the user submits an empty string as a task name, THE Todo_List SHALL NOT add a Task and SHALL display an inline validation message directly adjacent to the input field.
4. WHEN the user activates the complete control on a Task, THE Todo_List SHALL toggle the Task's completion status and persist the updated state to Local_Storage.
5. WHEN the user activates the delete control on a Task, THE Todo_List SHALL remove the Task from the list and persist the updated list to Local_Storage.
6. WHEN the user activates the edit control on a Task, THE Todo_List SHALL replace the Task's display with an inline input field pre-filled with the current task name.
7. WHEN the user confirms an edit (via Enter key or a save control), THE Todo_List SHALL update the Task's name with the new value and persist the updated name to Local_Storage.
8. WHEN the user cancels an edit (via Escape key), THE Todo_List SHALL discard the change, restore the original task name in the display, and NOT write to Local_Storage.
9. WHEN the Dashboard loads, THE Todo_List SHALL read all Tasks from Local_Storage and render them in the list without displaying validation messages.
10. IF Local_Storage is unavailable, THEN THE Todo_List SHALL render an empty list, display a user-visible error message, and SHALL NOT throw an unhandled error.

---

### Requirement 5: Prevent Duplicate Tasks

**User Story:** As a user, I want the dashboard to prevent me from adding the same task twice, so that my list stays clean and uncluttered.

#### Acceptance Criteria

1. This requirement is excluded from the MVP scope as it was not selected as a challenge.

---

### Requirement 6: Sort Tasks (Challenge)

**User Story:** As a user, I want to sort my task list, so that I can view tasks in a meaningful order.

#### Acceptance Criteria

1. THE Sort_Control SHALL provide at least two sort options: alphabetical by task name (A–Z, case-insensitive) and by completion status (incomplete tasks first, then completed tasks).
2. WHEN the user selects a sort option, THE Todo_List SHALL re-render the Tasks in the selected order without modifying the underlying data or order stored in Local_Storage.
3. WHEN new Tasks are added while a sort option is active, THE Todo_List SHALL apply the active sort order to the updated list immediately after the Task is added.
4. WHEN the Dashboard loads, THE Todo_List SHALL apply the default sort order (order of insertion) and the Sort_Control SHALL reflect "Default" as the active option.
5. WHEN the user selects the "Default" sort option, THE Todo_List SHALL render Tasks in their original insertion order as stored in Local_Storage.

---

### Requirement 7: Quick Links

**User Story:** As a user, I want to save and access my favorite websites quickly, so that I can navigate to them with a single click.

#### Acceptance Criteria

1. THE Quick_Links widget SHALL provide an input form with a label field (1–100 characters) and a URL field, and a save button.
2. WHEN the user submits a Link with a non-empty label (≤ 100 characters) and a valid URL (http:// or https:// scheme with a non-empty host), THE Quick_Links widget SHALL add the Link as a clickable button and persist all Links to Local_Storage, provided the total number of saved Links does not exceed 50.
3. WHEN the user submits a Link with an empty label, an oversized label, or an invalid URL, THE Quick_Links widget SHALL NOT add the Link and SHALL display an inline validation message identifying which field failed.
4. WHEN the user activates a Link button, THE Quick_Links widget SHALL open the associated URL in a new browser tab.
5. WHEN the user activates the delete control on a Link, THE Quick_Links widget SHALL remove the Link and persist the updated list to Local_Storage.
6. WHEN the Dashboard loads, THE Quick_Links widget SHALL read all Links from Local_Storage and render them as buttons within 500 ms.
7. IF Local_Storage is unavailable at load time or during a write, THEN THE Quick_Links widget SHALL render an empty links panel (or retain the in-memory list on write failure), display a user-visible error message, and SHALL NOT throw an unhandled error.

---

### Requirement 8: Light / Dark Mode (Challenge)

**User Story:** As a user, I want to switch between light and dark themes, so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Theme_Toggle SHALL be rendered as a visible button or switch in the Dashboard header or navigation area, present in the DOM on every page state.
2. WHEN the user activates the Theme_Toggle, THE Dashboard SHALL switch between the light theme and the dark theme, and the Theme_Toggle's visual state (e.g., icon or label) SHALL reflect the currently active theme.
3. WHEN the user activates the Theme_Toggle, THE Dashboard SHALL persist the selected theme preference ("light" or "dark") in Local_Storage under a dedicated key.
4. WHEN the Dashboard loads, THE Dashboard SHALL read the theme preference from Local_Storage and apply the corresponding theme attribute to the root element before the first paint, so no flash of the wrong theme is visible.
5. IF no theme preference has been saved, THEN THE Dashboard SHALL apply the light theme as the default.
6. IF Local_Storage is unavailable, THEN THE Dashboard SHALL apply the light theme and SHALL NOT throw an unhandled error.

---

### Requirement 9: File Structure and Technical Constraints

**User Story:** As a developer, I want the project to follow a clean, predictable file structure, so that the codebase is easy to read and maintain.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using HTML, CSS, and Vanilla JavaScript only; no external JavaScript frameworks, CSS frameworks, or third-party libraries shall be loaded from any source.
2. THE Dashboard SHALL contain exactly one CSS file located at `css/style.css`.
3. THE Dashboard SHALL contain exactly one JavaScript file located at `js/app.js`.
4. THE Dashboard SHALL have a single HTML entry point at `index.html` in the project root.
5. THE Dashboard SHALL render without layout breakage and all interactive controls SHALL respond to user input in the latest stable versions of Chrome, Firefox, Edge, and Safari.
6. THE Dashboard SHALL require no backend server and SHALL operate entirely from the local file system or a static file host.
7. WHEN loaded over a 25 Mbps broadband connection, THE Dashboard SHALL become interactive (all event listeners attached and UI responding to input) within 2 seconds of the initial page load.
