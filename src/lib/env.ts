import { z } from 'zod';

// Schéma pour les variables d'environnement côté client (NEXT_PUBLIC_*)
const clientEnvSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z
        .string()
        .url('NEXT_PUBLIC_SUPABASE_URL doit être une URL valide')
        .min(1, 'NEXT_PUBLIC_SUPABASE_URL est requis'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z
        .string()
        .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY est requis'),
    NEXT_PUBLIC_APP_URL: z
        .string()
        .url('NEXT_PUBLIC_APP_URL doit être une URL valide')
        .min(1, 'NEXT_PUBLIC_APP_URL est requis')
        .optional(),
});

// Schéma pour les variables d'environnement côté serveur
const serverEnvSchema = z.object({
    // Variables serveur optionnelles (ajouter selon les besoins)
    // Exemple : SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, etc.
});

// Type des variables client validées
export type ClientEnv = z.infer<typeof clientEnvSchema>;

// Type des variables serveur validées
export type ServerEnv = z.infer<typeof serverEnvSchema>;

// Fonction pour valider les variables client
function getClientEnv(): ClientEnv {
    try {
        return clientEnvSchema.parse({
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.issues
                .map((issue) => issue.path.join('.'))
                .join(', ');
            throw new Error(
                `❌ Variables d'environnement manquantes ou invalides : ${missingVars}\n` +
                `Vérifiez votre fichier .env.local et assurez-vous que toutes les variables requises sont définies.`
            );
        }
        throw error;
    }
}

// Fonction pour valider les variables serveur
export function getServerEnv(): ServerEnv {
    try {
        return serverEnvSchema.parse({});
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.issues
                .map((issue) => issue.path.join('.'))
                .join(', ');
            throw new Error(
                `❌ Variables d'environnement serveur manquantes ou invalides : ${missingVars}\n` +
                `Vérifiez votre fichier .env.local et assurez-vous que toutes les variables requises sont définies.`
            );
        }
        throw error;
    }
}

// Variables client validées (exportées pour utilisation dans l'app)
export const env = getClientEnv();

// Export des variables individuelles pour faciliter l'utilisation
export const {
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL,
} = env;

