# AGC Phone v0.2.0 — Development build

A standalone QBCore/Qbox FiveM smartphone under development, with iPhone-inspired and Samsung-inspired styles.

## Implemented
- Automatic SQL creation for settings, numbers, contacts, messages and call history (oxmysql).
- Automatically assigned persistent 10-digit character phone numbers.
- Contact saving/deletion, basic SMS to phone numbers, offline message persistence.
- Incoming/outgoing calls using pma-voice call channels; hang up, answer and timeout.
- Theme switching and F1 /phone toggle.

## Install
Place in resources/[local]/agc-phone and ensure oxmysql, your framework (qb-core or qbx_core), pma-voice, then agc-phone. SQL is created on startup; the MySQL account requires CREATE TABLE privileges.

## Important limitations
**Not ready to replace qb-phone in production.** No qb-phone event/export compatibility yet, no data migration, no item handling, and no advanced apps. The old SMS table stores citizen IDs, and old messages are not migrated to phone-number labels. Calls and database operations require testing on a live server. Disable the F1 keybind conflict before testing, but do not remove qb-phone from a production server yet.

## Test
Use two characters on separate clients, open /phone, note both assigned numbers, add a contact, send an SMS, place a call, answer and hang up, restart the resource and check persistence. Watch server console for database errors.
