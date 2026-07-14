# Patient workspace

The workspace uses a sticky patient context bar and `Overview | Visit | History | Timeline | More`. Visit steps are `History | Examination | Assessment | Plan | Review`; Plan nests prescriptions, investigations, and follow-up. Only the active section expands. Drafts use IndexedDB autosave/recovery; cancellations, offline state, timeouts, and real session expiry are distinct. Smart tags can be edited/removed/undone before finalization and amended with reason/audit afterward.
