import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Layout pour les pages protégées (nécessitant une authentification)
 * Redirige automatiquement vers /login si l'utilisateur n'est pas connecté
 */
export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    // Si pas d'utilisateur ou erreur, rediriger vers login
    if (error || !user) {
        redirect('/login');
    }

    return <>{children}</>;
}
