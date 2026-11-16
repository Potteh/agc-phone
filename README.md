# AGC Phone v0.5.0 — Development build

A standalone QBCore/Qbox FiveM smartphone under development, with iPhone-inspired and Samsung-inspired styles.

## Implemented
- Automatic SQL creation for settings, numbers, contacts, messages and call history (oxmysql).
- Automatically assigned persistent 10-digit character phone numbers.
- Contact saving/deletion with optional HTTPS photo URL, basic SMS to phone numbers, offline message persistence.\n- Redesigned iPhone/Galaxy UI, conversation filtering, contact avatars, and in-phone message/call notifications.\n- Automatic safe migration adds the optional contact photo column to existing databases.
- Incoming/outgoing calls using pma-voice call channels; hang up, answer and timeout.
- Theme switching and F1 /phone toggle.

## Install
Place in resources/[local]/agc-phone and ensure oxmysql, your framework (qb-core or qbx_core), pma-voice, then agc-phone. SQL is created on startup; the MySQL account requires CREATE TABLE privileges.

## v0.4 appearance features\n- Optional lock screen with unlock button (not a PIN or security mechanism).\n- Four preset wallpapers and a notification center for current-session events.\n- Brightness display setting, light/dark mode, and a stored notification sound preference (audio playback not yet implemented).\n- Appearance preferences are stored per character in a new automatically created SQL table.\n\n## v0.5 interface features\n- Rearrange the four existing home-screen app icons using desktop drag-and-drop; layout is stored per character.\n- Home-screen date/time and notification count widgets.\n- Notification center accessible from the lock screen; notifications remain session-only.\n- Grouped settings layout for appearance, notifications, and device style.\n- Existing phone apps, calls and messages are preserved; multiplayer testing remains pending.\n\n## Important limitations
**Not ready to replace qb-phone in production.** No qb-phone event/export compatibility yet, no data migration, no item handling, and no advanced apps. The old SMS table stores citizen IDs, and old messages are not migrated to phone-number labels. Calls, NUI and database operations require testing on a live server. Disable the F1 keybind conflict before testing, but do not remove qb-phone from a production server yet.

## Test
Use two characters on separate clients, open /phone, note both assigned numbers, add a contact, send an SMS, place a call, answer and hang up, restart the resource and check persistence. Watch server console for database errors.
