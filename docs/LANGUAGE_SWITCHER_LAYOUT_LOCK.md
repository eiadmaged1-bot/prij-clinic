# Language Switcher Layout Lock

Arabic selection is text-only. The app keeps `document.dir` and the shell layout LTR so icons, logo, cards, controls, fields, and sidebars stay in the same visual positions.

Arabic strings render inside stable components. Text can use plaintext bidi behavior where needed, but the app must not use a global RTL layout flip for language selection.

Required checks:
- Login layout positions stay stable in English and Arabic.
- Topbar account, logout, language, and chat controls stay in the same visual order.
- Sidebar structure stays stable.
- Arabic labels exist for key workflow labels.
- Alerts and status messages do not start with stray punctuation.
