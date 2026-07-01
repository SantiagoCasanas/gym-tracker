import type { AuthUser } from "../middleware/auth";

import { photoUrl } from "./photos";

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  age: number | null;
  gender: string | null;
  avatarId: string | null;
}

/**
 * Builds the public representation of a user. Never exposes passwordHash.
 * `avatarId` (Photo id in the DB) is turned into a servable `/photos/<id>` URL.
 */
export function serializeUser(u: UserRecord): AuthUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    age: u.age,
    gender: u.gender,
    avatarUrl: photoUrl(u.avatarId),
  };
}
