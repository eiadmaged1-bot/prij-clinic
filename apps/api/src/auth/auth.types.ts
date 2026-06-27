export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  branchId: string | null;
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
