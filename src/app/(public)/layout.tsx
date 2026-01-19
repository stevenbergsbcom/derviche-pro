import { AdminBar } from '@/components/admin/admin-bar';

/**
 * Layout pour les pages publiques (catalogue, spectacles, réservation)
 * Accessible sans authentification
 */
export default function PublicLayout({
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
