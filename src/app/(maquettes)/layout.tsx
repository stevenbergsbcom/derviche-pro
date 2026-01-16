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
            
            {children}
        </>
    );
}
