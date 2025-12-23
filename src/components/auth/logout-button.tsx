'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signOut();

            if (error) {
                toast.error('Une erreur est survenue lors de la déconnexion');
                return;
            }

            toast.success('Déconnexion réussie');

            // Rediriger vers /accueil
            router.push('/accueil');
        } catch (error) {
            logger.error('[Logout] Erreur lors de la déconnexion', error as Error);
            toast.error('Une erreur est survenue lors de la déconnexion');
        } finally {
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

