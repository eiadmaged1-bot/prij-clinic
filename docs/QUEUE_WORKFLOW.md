# Queue workflow

The active key is patient + branch + clinic date with `waiting` or `called`; completed/cancelled tickets release the lock. Check-in is idempotent/audited. Search never auto-selects and shows disambiguation plus current queue state. The database uses `called` for in-room.
