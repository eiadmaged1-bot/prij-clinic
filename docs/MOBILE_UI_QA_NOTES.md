# Mobile UI QA Notes

v1.3.8 mobile fixes:
- Drawer has header/nav/footer structure.
- Footer contains language switch and labeled logout.
- Visit type buttons use fixed Arabic labels and avoid letter-by-letter wrapping.
- Patient registry cards are more compact.
- New patient registration includes patient type, a generated file number control, and the reception-visible Not sexually active checkbox.

Manual QA should cover mobile Safari/ngrok and narrow viewport widths.
# v1.3.9 Mobile UI QA Notes

- Confirm floating language overlays are absent.
- Confirm the segmented `عربي | EN` control is visible on login, topbar, and mobile drawer footer.
- Confirm Arabic navigation labels render without layout flipping.
- Confirm G/P/A/L steppers fit on mobile and plus/minus do not shift layout.
- Confirm Calendar stat cards are compact and no black placeholder appears.
- Confirm External Intake Inbox readable fields do not expose raw JSON.
- Confirm Patient QR remains available and temporary Queue Ticket QR is absent.
