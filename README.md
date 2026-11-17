# AGC Phone v0.6.0 — Development build

A standalone QBCore/Qbox FiveM smartphone with iPhone-inspired and Samsung-inspired styles.

## Implemented
- Automatic SQL creation for settings, numbers, contacts, messages, and call history using oxmysql.
- Persistent 10-digit phone numbers per character.
- Contacts with optional HTTPS photo URLs.
- SMS storage and incoming/outgoing call flow using pma-voice.
- iPhone and Samsung themes, lock screen, four wallpapers, brightness, and light/dark mode.
- Per-character home-screen app ordering.
- Home widgets for date, time, and notification count.
- Session notification center, including access from the lock screen.
- v0.6 Control Center with quick toggles for dark mode, sound preference, lock screen, notifications, brightness, and wallpaper.
- Home Screen Edit mode: tap Edit, select two app icons to swap their positions, then Done. Desktop drag-and-drop remains available.
- Client and server restrictions against phone use while dead or in last stand.

## Install
Place this resource in `resources/[local]/agc-phone`. Ensure oxmysql, your framework (qb-core or qbx_core), pma-voice, and then agc-phone. SQL tables and migrations are applied automatically; the database user needs CREATE/ALTER privileges.

## v0.6.0 notes
The Control Center and home-screen edit mode are interface features. The sound toggle currently stores a preference; it does not yet play notification audio. Notifications remain in the current NUI session and are not yet persisted or delivered while the phone UI is closed. Home icon order is stored per character.

## Important limitations
**Not ready to replace qb-phone in production.** qb-phone event/export compatibility, data migration, item handling, and advanced apps are not complete. Calls and messaging still need multiplayer testing on a live server. Keep qb-phone installed until compatibility and migration are verified.

## Test
1. Update the resource and restart it.
2. Open the phone and use the top-right Control Center button.
3. Toggle dark mode, sound preference, lock screen, brightness, and wallpaper.
4. Close Control Center and verify the corresponding settings page reflects the changes.
5. Use Edit Home Screen, select two icons to swap, tap Done, close/reopen the phone, and verify the order persists.
6. Test notification center access from both the unlocked screen and lock screen.
7. Watch the server console for SQL or NUI errors.

Calling and SMS should be tested with two characters on separate clients when available.
