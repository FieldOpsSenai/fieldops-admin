/**
 * Controle de autorização apenas da interface.
 *
 * IMPORTANTE:
 * a API continua sendo a fonte definitiva de autorização.
 */

export type AppRole =
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'TECHNICIAN'
  | 'CLIENT_VIEWER'
  | 'UNKNOWN';

export function normalizeRole(profile?: string | null): AppRole {
  const value = profile?.trim().toUpperCase();

  switch (value) {
    case 'ADMIN':
    case 'ADMINISTRADOR':
      return 'ADMIN';

    case 'SUPERVISOR':
      return 'SUPERVISOR';

    case 'TECHNICIAN':
    case 'TECNICO':
    case 'TÉCNICO':
      return 'TECHNICIAN';

    case 'CLIENT_VIEWER':
    case 'CLIENTE':
      return 'CLIENT_VIEWER';

    default:
      return 'UNKNOWN';
  }
}

export function canAccessAdminWeb(profile?: string | null): boolean {
  const role = normalizeRole(profile);

  return role === 'ADMIN' || role === 'SUPERVISOR';
}

export function canManageUsers(profile?: string | null): boolean {
  return normalizeRole(profile) === 'ADMIN';
}

export function canManageMasterData(profile?: string | null): boolean {
  const role = normalizeRole(profile);

  return role === 'ADMIN' || role === 'SUPERVISOR';
}

export function canManageTemplates(profile?: string | null): boolean {
  const role = normalizeRole(profile);

  return role === 'ADMIN' || role === 'SUPERVISOR';
}

export function canPlanInspections(profile?: string | null): boolean {
  const role = normalizeRole(profile);

  return role === 'ADMIN' || role === 'SUPERVISOR';
}

export function canReviewInspections(profile?: string | null): boolean {
  return normalizeRole(profile) === 'SUPERVISOR';
}