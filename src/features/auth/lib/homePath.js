const ELEVATED_ROLES = ["owner", "admin", "superadmin"];
const USERS_MANAGER_ROLES = ["owner", "superadmin"];

/** Dashboard, cargos, referências, deletes — owner + admin (+ platform superadmin). */
export function isElevatedRole(role) {
  return ELEVATED_ROLES.includes(role);
}

/** @deprecated Prefer isElevatedRole — kept as alias for existing imports. */
export function isAdminRole(role) {
  return isElevatedRole(role);
}

/** Only the tenant owner (or platform superadmin) manages user accounts. */
export function canManageUsers(role) {
  return USERS_MANAGER_ROLES.includes(role);
}

/** Post-login / home path for the current host + role. */
export function getHomePath({ isPlatform, role }) {
  if (isPlatform) return "/tenants";
  return isElevatedRole(role) ? "/dashboard" : "/estrutura";
}
