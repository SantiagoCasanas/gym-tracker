// SQLite has no native enums, so Role lives here as a string union + constants.
export type Role = "ADMIN" | "MEMBER";

export const Role = {
  ADMIN: "ADMIN" as Role,
  MEMBER: "MEMBER" as Role,
};

export function normalizeRole(value: unknown): Role {
  return value === "ADMIN" ? "ADMIN" : "MEMBER";
}
