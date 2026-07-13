# Production Design System

The clinic application has one official operational theme.

## Theme

- Background: white or soft neutral.
- Primary text: navy or charcoal.
- Accent: one teal accent.
- Danger: red only for danger and critical warnings.
- Gradients: avoid on operational screens.
- Shadows: keep light and functional.
- Cards: one consistent card style.
- Operational tokens: `#f7f9fa` background, `#ffffff` surface, `#172b3a` text, and `#087f7b` accent.
- Danger uses `#b42318`; warning uses muted amber `#9a6700`.
- Experimental themes are not shown in production settings.
- Standard card border is a subtle 1px neutral border with a 10px radius.
- Standard padding is 16px desktop and 12px mobile.

## Interaction

- One primary action per view.
- Maximum four immediately visible chips.
- Advanced details use progressive disclosure.
- Functional line icons are preferred for operational screens.
- Decorative 3D icons are allowed only in optional empty states.
- Disabled controls must explain why.
- Loading controls must be locked.
- Successful mutations must show visible confirmation.
- Operational screens expose one primary action and group secondary actions.
- Every icon action needs an accessible name and visible or discoverable label.
- Focus uses a visible teal outline; minimalism never removes keyboard affordances.
- Motion respects `prefers-reduced-motion`.

## Mobile

- Minimum touch target: 48px.
- No horizontal overflow.
- Desktop tables must not be forced onto phones.
- Tables become cards or scroll-safe summaries on mobile.
- Use sticky mobile patient context headers.
- Use sticky visit action footers.
- Support safe-area insets.
- Required widths: 360px, 390px, 430px, 768px, and desktop.
- Bottom sheets become full-screen on small phones when necessary.
- Sticky and fixed controls reserve content space and include safe-area insets.
- Complex mobile forms use viewport-fitting full-screen sheets.

## Language

- Arabic RTL and English LTR must both work.
- Avoid mixed-language alignment mistakes.
- Father/minimalistic mode uses large, clear labels.
- Keep logout and language access reachable.

## Print

Print design is separate from screen design and must not force screen layout compromises.
