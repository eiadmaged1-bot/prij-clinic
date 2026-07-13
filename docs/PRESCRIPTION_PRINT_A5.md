# A5 Prescription Printing

The prescription print view is a dedicated route/component, separate from the editor. It is available only when the prescription has at least one valid medication, required review/alert gates are handled, and the prescription is signed under existing role and patient-scope controls.

Print geometry:

```css
@page {
  size: A5 portrait;
  margin: 0;
}
```

The 148mm × 210mm view contains only the clinic template/background when configured, patient identity fields, date/file number when configured, medication rows in stored visual order, instructions, doctor name, signature/stamp area, and optional follow-up. Sidebar, top bar, search, buttons, empty editor fields, draft controls, and developer text are excluded.

Arabic and English are supported, with additional pages only for genuine overflow. Browser-generated URL/title headers are outside application control and must be disabled in the print dialog.

No final approved clinic background asset was found in this repository. The background and safe-area positions therefore remain configuration constants with an explicit approval TODO. The architecture is functional, but the clinic must approve the exact asset and field coordinates before operational use; the asset must not be redesigned or distorted.
