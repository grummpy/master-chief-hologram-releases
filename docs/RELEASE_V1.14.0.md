# Master Chief Hologram v1.14.0 — Durable Local Scheduler

## Mission increment

Add dependable reminders without requiring a cloud account, paid provider, or open PowerShell window. Scheduled entries and their histories are stored only in Master Chief's local application data.

## Available behavior

- Create one-time, daily, weekly, or 30-day reminders from **Files → Scheduled**.
- Receive a native macOS notification when the app is running.
- Pause, resume, or cancel an active reminder.
- Recover schedules after restarting Master Chief and reconcile an overdue occurrence once.
- Ask approved Ollama agent mode to list, create, pause, resume, or cancel reminders.
- Review state, next-run time, last-run time, and bounded history in the Scheduled workspace.

## Boundaries

- This release schedules local notifications; it does not poll email, financial accounts, websites, or other external systems.
- Master Chief must be running at the scheduled time. An overdue reminder is delivered when the app next opens.
- A 30-day repeat is an interval, not calendar-month recurrence.
- Direct UI scheduling does not invoke an AI model. Ollama scheduling requires the explicit scheduler Tool Access approvals.

## Evidence and quality gates

Automated tests cover persistence across restart, exactly-once completion, recurrence advancement after downtime, pause, resume, cancellation, IPC exposure, notification wiring, and UI controls.

| Gate | Score | Decision basis |
|---|---:|---|
| Foundation plan | 90/100 | Local ownership, persistence, state transitions, failure boundaries, and UI/agent interfaces are explicit. |
| Final product | 92/100 | Deterministic scheduler and UI contracts pass; live macOS notification presentation still depends on the user's notification settings. |

Decision: release the local reminder increment. Conditional external monitoring remains deferred and must not be claimed as available.
