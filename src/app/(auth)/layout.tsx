import { Card, CardContent } from '@/components/ui/card';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                {/* Logo / Nom de l'entreprise */}
                <div className="flex flex-col items-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Derviche Diffusion
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Réservation Professionnelle
                    </p>
                </div>

                {/* Contenu de la page (login, register, etc.) */}
                <Card className="w-full">
                    <CardContent className="pt-6">{children}</CardContent>
                </Card>
            </div>
        </div>
    );
}

