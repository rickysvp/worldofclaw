import type { platform_roles } from "./constants";

export type PlatformRole = (typeof platform_roles)[number];

export type PlatformActor = {
  actor_id: string;
  roles: PlatformRole[];
  owner_account_id: string | null;
  organization_id: string | null;
};
