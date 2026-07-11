import { coreAppActions } from "@prij-clinic/shared/src/app-actions";

export const appActionRegistry = new Map(coreAppActions.map((action) => [action.id, action]));

export function requireAppAction(actionId: string) {
  const action = appActionRegistry.get(actionId);
  if (!action) throw new Error(`Unknown app action: ${actionId}`);
  return action;
}

