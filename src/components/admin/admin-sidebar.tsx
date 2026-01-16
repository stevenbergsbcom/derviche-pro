'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    Calendar,
    Film,
    MapPin,
    Users,
    UserCog,
    Settings,
    LogOut,
    X,
    ExternalLink,
    User,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/auth/logout-button';
import { createClient } from '@/lib/supabase/client';
import type { InternalRole } from '@/types/database';

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    {
        label: 'Réservations',
        href: '/admin/reservations',
        icon: Calendar,
    },
    {
        label: 'Spectacles',
        href: '/admin/spectacles',
        icon: Film,
    },
    {
        label: 'Lieux',
        href: '/admin/lieux',
        icon: MapPin,
    },
    {
        label: 'Compagnies',
        href: '/admin/compagnies',
        icon: Users,
    },
    {
        label: 'Utilisateurs',
        href: '/admin/utilisateurs',
        icon: UserCog,
    },
    {
        label: 'Préférences',
        href: '/admin/preferences',
        icon: Settings,
    },
];

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

/** Labels des rôles pour l'affichage */
const ROLE_LABELS: Record<InternalRole, string> = {
    'super-admin': 'Super Admin',
    'admin': 'Admin',
    'externe': 'Externe',
};

/** Données utilisateur pour la sidebar */
interface SidebarUserData {
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
    const pathname = usePathname();
    const [userData, setUserData] = useState<SidebarUserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Charger les données de l'utilisateur connecté
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setIsLoading(false);
                    return;
                }

                // Récupérer le profil et le rôle
                const { data: profile } = await supabase
                    .from('profiles')
                    .select(`
                        first_name,
                        last_name,
                        email,
                        user_roles!inner (role)
                    `)
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    // Extraire le rôle (peut être un tableau ou un objet)
                    const userRoles = profile.user_roles;
                    let roleValue = 'Utilisateur';
                    
                    if (Array.isArray(userRoles) && userRoles.length > 0) {
                        const role = (userRoles[0] as { role: string }).role;
                        roleValue = ROLE_LABELS[role as InternalRole] || role;
                    } else if (userRoles && typeof userRoles === 'object' && 'role' in userRoles) {
                        const role = (userRoles as { role: string }).role;
                        roleValue = ROLE_LABELS[role as InternalRole] || role;
                    }

                    setUserData({
                        firstName: profile.first_name,
                        lastName: profile.last_name,
                        email: profile.email,
                        role: roleValue,
                    });
                }
            } catch (error) {
                console.error('Erreur chargement utilisateur sidebar:', error);
            } finally {
                setIsLoading(false);
            }
        };

        void fetchUserData();
    }, []);

    // Formater le nom d'affichage
    const displayName = userData
        ? (userData.firstName || userData.lastName)
            ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
            : userData.email
        : 'Chargement...';

    return (
        <>
            {/* Overlay sombre sur mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed left-0 top-0 h-screen w-[260px] bg-derviche-dark flex flex-col z-50
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0
                `}
            >
                {/* Bouton fermer sur mobile */}
                <div className="flex items-center justify-between p-4 border-b border-derviche/30 lg:hidden">
                    <p className="text-sm font-medium text-white">Menu</p>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 text-white hover:text-gold hover:bg-derviche/50"
                    >
                        <X className="w-5 h-5" />
                        <span className="sr-only">Fermer le menu</span>
                    </Button>
                </div>

                {/* Header avec Logo */}
                <div className="p-6 border-b border-derviche/30">
                    <Link href="/admin-dashboard" className="flex flex-col items-center">
                        <Image
                            src="/images/logos/logo-derviche-blanc-transparent.png"
                            alt="Derviche Diffusion"
                            width={240}
                            height={100}
                            className="h-24 w-auto mb-2"
                            priority
                        />
                        <p className="text-sm font-medium text-white/80">Administration</p>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 overflow-y-auto">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={onClose}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                                            ${isActive
                                                ? 'bg-derviche text-gold border-l-[3px] border-gold'
                                                : 'text-white/70 hover:bg-derviche/50 hover:text-gold'
                                            }
                                        `}
                                    >
                                        <Icon className="w-5 h-5 shrink-0" />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer avec utilisateur */}
                <div className="p-4 border-t border-derviche/30">
                    {/* Bouton Voir le site */}
                    <Link
                        href="/accueil"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2.5 mb-3 rounded-lg bg-gold/20 text-gold hover:bg-gold/30 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm font-medium">Voir le site</span>
                    </Link>
                    
                    <div className="mb-3 px-3">
                        <p className="text-xs text-white/50 mb-1">Connecté en tant que</p>
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-white/70">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="text-sm">Chargement...</span>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-gold">{userData?.role || 'Utilisateur'}</p>
                                <p className="text-sm text-white truncate">{displayName}</p>
                            </>
                        )}
                    </div>
                    
                    {/* Lien Mon compte */}
                    <Link
                        href="/admin/mon-compte"
                        onClick={onClose}
                        className="flex items-center gap-2 w-full px-3 py-2.5 mb-2 rounded-lg text-white/70 hover:text-gold hover:bg-derviche/50 transition-colors"
                    >
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">Mon compte</span>
                    </Link>
                    
                    <LogoutButton
                        variant="ghost"
                        className="w-full justify-start text-white/70 hover:text-gold hover:bg-derviche/50"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                    </LogoutButton>
                </div>
            </aside>
        </>
    );
}
