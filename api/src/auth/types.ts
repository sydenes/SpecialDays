export type UserRole = "user" | "admin";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};
