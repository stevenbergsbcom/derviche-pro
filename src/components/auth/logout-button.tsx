'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';

import { createClient } from '@/lib/supabase/client';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface LogoutButtonProps {
    variant?: VariantProps<typeof buttonVariants>['variant'];
    className?: string;
    children?: React.ReactNode;
}

export function LogoutButton({
    variant = 'outline',
    className,
    children = 'Se déconnecter',
}: LogoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signOut();

            if (error) {
                toast.error('Une erreur est survenue lors de la déconnexion');
                setIsLoading(false);
                return;
            }

            // Navigation dure pour éviter le flash d'erreur :
            // router.push() (navigation client-side) peut déclencher
            // une re-validation de la route courante avant de naviguer
            // vers /login, ce qui fait flasher brièvement la page d'erreur.
            // window.location.href force un rechargement complet avec cookies vides.
            window.location.href = '/login';
        } catch (error) {
            logger.error('[Logout] Erreur lors de la déconnexion', error as Error);
            toast.error('Une erreur est survenue lors de la déconnexion');
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant={variant}
            className={cn(className)}
            onClick={handleLogout}
            disabled={isLoading}
        >
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {children}
        </Button>
    );
}

