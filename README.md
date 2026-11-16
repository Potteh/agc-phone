# AGC Phone v0.1.1 (starter)

QBCore/Qbox compatible dual-theme phone with persistent theme and basic online/offline SMS by citizen ID.

## Install
1. Copy `agc-phone` into `resources/[local]/`.
2. No manual SQL import is needed. Tables are created automatically on resource start (requires a configured `oxmysql` connection and CREATE TABLE permissions).
3. Ensure `oxmysql`, then `qb-core` or `qbx_core`, then `agc-phone` in server.cfg. Check console for database initialization success.
4. Restart and press F1 or use `/phone`.

## Notes
This is a starter and is NOT yet a full qb-phone replacement. Contacts, camera, voice calls, banking, and other app tiles are planned, not implemented. Messages currently address a citizen ID, not a phone number. Disable conflicting phone keybinds if necessary. No inventory item requirement yet. Do not remove qb-phone until compatibility and feature migration are completed.
