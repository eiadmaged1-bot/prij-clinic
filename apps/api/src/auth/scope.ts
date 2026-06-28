import type { AuthUser } from "./auth.types";

export const EMPTY_SCOPE_ID = "00000000-0000-0000-0000-000000000000";

export function isOwnerOrAdmin(user: AuthUser) {
  return user.roles.includes("Owner") || user.roles.includes("Admin");
}

export function isDoctor(user: AuthUser) {
  return user.roles.includes("Doctor");
}

export function branchScope(user: AuthUser) {
  if (isOwnerOrAdmin(user)) return {};

  return { branchId: user.branchId ?? EMPTY_SCOPE_ID };
}

export function patientBranchScope(user: AuthUser) {
  if (isOwnerOrAdmin(user)) return {};

  return { patient: { branchId: user.branchId ?? EMPTY_SCOPE_ID } };
}

export function doctorScope(user: AuthUser) {
  if (isOwnerOrAdmin(user) || !isDoctor(user)) return {};

  return { doctorId: user.id };
}
