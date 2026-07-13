export type AuthUser = {
  id: string;
  email: string;
  loginId: string | null;
  displayName: string;
  status: string;
  branchId: string | null;
  branchName: string | null;
  permissionPreset: string;
  protectedAccount: boolean;
  isSystemOwner: boolean;
  roles: string[];
  permissions: string[];
};

export type RequestWithUser = {
  headers: {
    authorization?: string;
    cookie?: string;
  };
  ip?: string;
  method?: string;
  path?: string;
  get(name: string): string | undefined;
  user?: AuthUser;
};
