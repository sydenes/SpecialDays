import type { SpecialPageAdmin } from "../entities/specialPage.entity.js";
import { formatOwnerLabel } from "../entities/specialPage.entity.js";
import { isAdmin } from "../auth/permissions.js";
import type { AuthUser } from "../auth/types.js";

/** API yanıtında hassas alanları gizle */
export function toPageApiResponse(page: SpecialPageAdmin, viewer: AuthUser | null) {
  const { accessPasswordHash, previewToken, ...rest } = page;
  const base = {
    ...rest,
    hasAccessPassword: Boolean(accessPasswordHash),
    ownerLabel: formatOwnerLabel(page),
  };
  if (viewer && isAdmin(viewer)) {
    return { ...base, previewToken: previewToken ?? null };
  }
  if (viewer && viewer.id === page.ownerUserId) {
    return { ...base, previewToken: previewToken ?? null };
  }
  return base;
}
