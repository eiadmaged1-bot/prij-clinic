# Mobile Testing Guide

Preferred command:

```powershell
npm run design:serve-html
```

Open the printed localhost URL on the computer. For a phone, connect to the same Wi-Fi and open the printed LAN URL.

Why use the server instead of file://:
- Phone browsers cannot open the developer machine file path directly.
- LocalStorage, relative assets, and browser security behavior are closer to a normal deployed static site.
- The server exposes only the `ui-export` folder.

Manual checks:
- Dashboard opens first.
- Menu opens the drawer at phone widths.
- Nav item taps switch sections and close the drawer.
- Overlay closes the drawer.
- Theme changes apply immediately and persist after refresh.
- No horizontal scrolling at 360, 375, 390, 414, 430, and 768 pixel widths.
