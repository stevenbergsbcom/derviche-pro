import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types/database';

/**
 * Récupère le rôle principal d'un utilisateur
 * Priorité : super-admin > admin > externe-dd > company > professional
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error || !data || data.length === 0) {
    return null;
  }

  // Priorité des rôles (du plus privilégié au moins privilégié)
  const rolePriority: UserRole[] = ['super-admin', 'admin', 'externe-dd', 'company', 'professional'];

  const userRoles = data.map((r: { role: string }) => r.role as UserRole);

  // Retourner le rôle avec la plus haute priorité
  for (const role of rolePriority) {
    if (userRoles.includes(role)) {
      return role;
    }
  }

  return userRoles[0] || null;
}

/**
 * Retourne l'URL de redirection selon le rôle de l'utilisateur
 */
export function getRedirectUrlByRole(role: UserRole | null): string {
  switch (role) {
    case 'super-admin':
    case 'admin':
      return '/admin/spectacles';
    case 'externe-dd':
      return '/checkin';
    case 'company':
      // TODO: Créer /compagnie/dashboard pour les compagnies
      return '/dashboard';
    case 'professional':
    default:
      return '/dashboard';
  }
}
