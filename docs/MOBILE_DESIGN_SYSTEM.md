# Mobile design system

v1.4.6 adds four full-width Investigation tabs at ≤640 px, horizontal category scrolling, normal word breaking, sticky basket actions, and collapsed History. Physical 360/375/390/412/430 px walkthroughs remain pending.

The shared application header is sticky, safe-area aware, role-neutral while authorization loads, and uses 44 px minimum controls. Mobile account controls use a viewport-contained focus-managed bottom sheet; desktop uses an anchored menu. Compact two-column action/KPI grids collapse safely at narrow widths, avoid mid-word breaks, and inherit `html[dir="rtl"]` direction.
