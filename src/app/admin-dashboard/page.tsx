import { redirect } from 'next/navigation';

export default function AdminDashboardPage() {
    // Rediriger vers la page spectacles par défaut
    redirect('/admin/spectacles');
}
