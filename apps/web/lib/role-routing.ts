export type RoleIdentity = {
  roles: string[];
  permissions?: string[];
};

const ownerRoles = new Set(["Owner", "Admin", "Super Admin"]);
const doctorRoles = new Set(["Doctor"]);
const receptionRoles = new Set(["Reception", "Receptionist"]);

export function isOwnerAdmin(identity: RoleIdentity) {
  return identity.roles.some((role) => ownerRoles.has(role)) || Boolean(identity.permissions?.some((permission) => ["clinic_settings.manage", "user.manage"].includes(permission)));
}

export function isDoctor(identity: RoleIdentity) {
  return identity.roles.some((role) => doctorRoles.has(role));
}

export function isReceptionist(identity: RoleIdentity) {
  return identity.roles.some((role) => receptionRoles.has(role));
}

export function roleLandingPath(identity: RoleIdentity) {
  if (isOwnerAdmin(identity)) return "/owner-control";
  if (isDoctor(identity)) return "/doctor";
  if (isReceptionist(identity)) return "/reception";
  return "/dashboard";
}

export function canAccessWorkspace(pathname: string, identity: RoleIdentity) {
  if (pathname === "/doctor" || pathname.startsWith("/doctor/")) {
    return isOwnerAdmin(identity) || isDoctor(identity);
  }
  if (pathname === "/reception" || pathname.startsWith("/reception/")) {
    return isOwnerAdmin(identity) || isReceptionist(identity);
  }
  if (pathname === "/owner-control" || pathname.startsWith("/owner-control/") || pathname === "/admin" || pathname.startsWith("/admin/")) {
    return isOwnerAdmin(identity);
  }
  return true;
}

export function safePostLoginPath(requestedPath: string | null | undefined, identity: RoleIdentity) {
  const isLocalPath = Boolean(requestedPath?.startsWith("/") && !requestedPath.startsWith("//"));
  if (!isLocalPath || requestedPath === "/dashboard") return roleLandingPath(identity);
  return canAccessWorkspace(requestedPath!, identity) ? requestedPath! : roleLandingPath(identity);
}
