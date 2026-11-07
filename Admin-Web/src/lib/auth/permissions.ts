/**
 * Controle de autorização apenas da interface.
 *
 * ADMIN e SUPERVISOR acessam a interface administrativa.
 * Ações específicas podem ser restritas por perfil.
 *
 * IMPORTANTE:
 * a API continua sendo a autoridade final.
 */

export type AppRole =
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'TECHNICIAN'
  | 'CLIENT_VIEWER'
  | 'UNKNOWN';

export function normalizeRole(
  profile?: string | null
): AppRole {
  const value = profile
    ?.trim()
    .toUpperCase();

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

function isAdministrativeRole(
  profile?: string | null
): boolean {
  const role =
    normalizeRole(profile);

  return (
    role === 'ADMIN' ||
    role === 'SUPERVISOR'
  );
}

export function canAccessAdminWeb(
  profile?: string | null
): boolean {
  return isAdministrativeRole(
    profile
  );
}

export function canManageUsers(
  profile?: string | null
): boolean {
  return isAdministrativeRole(profile);
}

export function canManageMasterData(
  profile?: string | null
): boolean {
  return isAdministrativeRole(
    profile
  );
}

export function canManageTemplates(
  profile?: string | null
): boolean {
  return isAdministrativeRole(
    profile
  );
}

export function canPlanInspections(
  profile?: string | null
): boolean {
  return isAdministrativeRole(
    profile
  );
}

export function canReviewInspections(
  profile?: string | null
): boolean {
  return isAdministrativeRole(profile);
}
