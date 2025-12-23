import { AdminBar } from '@/components/admin/admin-bar';

export default function MaquettesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* Barre admin (visible uniquement pour les admins connectés) */}
            <AdminBar />
            
            {/* Bandeau mode maquette */}
            <div className="bg-yellow-500 text-yellow-950 px-4 py-2 text-center font-semibold">
                MODE MAQUETTE
            </div>
            
            {children}
        </>
    );
}
