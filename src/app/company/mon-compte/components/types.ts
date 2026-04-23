/** Types partagés pour la page Mon Compte — Espace Compagnie */

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Formate le rôle technique en libellé lisible */
export function formatRole(role: string): string {
  switch (role) {
    case 'super-admin': return 'Super Admin';
    case 'admin': return 'Admin';
    case 'externe': return 'Externe DD';
    case 'professional': return 'Professionnel·le';
    case 'company': return 'Compagnie';
    default: return role;
  }
}

/** Retourne les classes CSS du badge selon le rôle */
export function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'super-admin': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
    case 'admin': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    case 'externe': return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
    case 'professional': return 'bg-green-500/10 text-green-700 border-green-500/20';
    case 'company': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
}
