# Appearance Studio

Theme configuration is normalized at runtime. Unknown, renamed legacy, null, malformed, removed, and partial values fall back to Dr Maged Premium. Corrupted local storage is cleared safely; server preference failure does not crash the route. Admin can retry preview and reset stored configuration. Available themes include Dr Maged Premium, Clinical Green, Lavender, Rose, Minimal White, Compact Operations, and High Contrast across device, account, role, and clinic scopes.

Appearance changes affect presentation only and never clinical meaning or patient-panel data.

v1.5.1 also normalizes clinic and role settings on the API boundary. Unknown keys, invalid theme IDs, malformed role entries, unsafe colors, and out-of-range numeric values are discarded before storage or response. Dr Maged Premium is the server and browser fallback. Live previews cover Reception, Doctor patient file, Investigations, Ultrasound, Knowledge Center, Owner layouts, mobile, and Arabic RTL.
