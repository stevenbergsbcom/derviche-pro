import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">

                {/* Logo cliquable + lien retour */}
                <div className="flex flex-col items-center space-y-4">
                    <Link href="/" aria-label="Retour à l'accueil">
                        <Image
                            src="/images/logos/logo-derviche-noir.png"
                            alt="Derviche Diffusion"
                            width={200}
                            height={80}
                            className="h-16 w-auto object-contain"
                            priority
                        />
                    </Link>

                    <p className="text-sm text-muted-foreground">
                        Réservation Professionnelle
                    </p>

                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-3.5" />
                        Retour au catalogue
                    </Link>
                </div>

                {/* Contenu de la page (login, register, etc.) */}
                <Card className="w-full">
                    <CardContent className="pt-6">{children}</CardContent>
                </Card>
            </div>
        </div>
    );
}
