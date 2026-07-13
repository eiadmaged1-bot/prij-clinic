import { test, expect } from "@playwright/test";
import { coreAppActions } from "../../packages/shared/src/app-actions";

test("core production actions have bilingual labels and contracts", async () => {
  for (const action of coreAppActions) {
    expect(action.id).toMatch(/^[a-z0-9_.:-]+$/);
    expect(action.labelAr.trim().length).toBeGreaterThan(0);
    expect(action.labelEn.trim().length).toBeGreaterThan(0);
    expect(Boolean(action.route || action.handlerContract)).toBeTruthy();
    expect(action.accessibleName.trim().length).toBeGreaterThan(0);
    expect(action.disabledReason.trim().length).toBeGreaterThan(0);
  }
});
