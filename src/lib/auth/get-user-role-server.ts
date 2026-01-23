import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database';

/**
 * Récupère le rôle principal d'un utilisateur (version serveur)
 * Priorité : super-admin > admin > externe > company > professional
 */
export async function getUserRoleServer(userId: string): Promise<UserRole | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error || !data || data.length === 0) {
    return null;
  }

  // Priorité des rôles (du plus privilégié au moins privilégié)
  const rolePriority: UserRole[] = ['super-admin', 'admin', 'externe', 'company', 'professional'];

  const userRoles = data.map((r: { role: string }) => r.role as UserRole);

  // Retourner le rôle avec la plus haute priorité
  for (const role of rolePriority) {
    if (userRoles.includes(role)) {
      return role;
    }
  }

  return userRoles[0] || null;
}
