/**
 * Page Admin - Fiche détaillée d'un professionnel
 * /admin/professionnels/[id]
 *
 * Affiche :
 *  - Informations du profil (lecture seule)
 *  - Historique complet de toutes ses réservations
 *    (spectacle, date, statut résa, statut checkin)
 *
 * Derviche Diffusion — Session S152
 */

'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Building2,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CalendarDays,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { Professional } from '@/lib/services/professionals';
import type { ProfessionalReservationHistoryEntry } from '@/app/api/admin/professionals/[professionalId]/history/route';

// ============================================
// TYPES
// ============================================

interface PageProps {
  params: Promise<{ id: string }>;
}

// ============================================
// CONFIGURATION STATUTS RÉSERVATION
// ============================================

const RESERVATION_STATUS_CONFIG = {
  confirmed: { label: 'Confirmée',   className: 'bg-green-100 text-green-800 border-green-200' },
  cancelled:  { label: 'Annulée',    className: 'bg-red-100 text-red-800 border-red-200'       },
  no_show:    { label: 'No show',    className: 'bg-gray-100 text-gray-700 border-gray-200'    },
} as const;

// ============================================
// CONFIGURATION STATUTS CHECKIN
// ============================================

const CHECKIN_STATUS_CONFIG: Record<
  NonNullable<ProfessionalReservationHistoryEntry['checkin_status']>,
  { label: string; className: string }
> = {
  present_loved:   { label: '❤️ Coup de cœur', className: 'bg-pink-100 text-pink-800 border-pink-200'     },
  present_press:   { label: '📰 Presse',        className: 'bg-purple-100 text-purple-800 border-purple-200' },
  present_neutral: { label: '✓ Présent',        className: 'bg-blue-100 text-blue-800 border-blue-200'    },
  absent:          { label: 'Absent',           className: 'bg-orange-100 text-orange-800 border-orange-200' },
};

// ============================================
// HELPERS
// ============================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  // timeStr format: "HH:MM:SS"
  return timeStr.slice(0, 5);
}

// ============================================
// SOUS-COMPOSANT : LIGNE D'INFO
// ============================================

function InfoRow({
  icon: Icon,
  label,
  value,
  isEmail = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  isEmail?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-muted/40 last:border-0">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground w-32 shrink-0">{label}</span>
      {isEmail ? (
        <a
          href={`mailto:${value}`}
          className="text-sm font-medium hover:underline text-derviche truncate"
        >
          {value}
        </a>
      ) : (
        <span className="text-sm font-medium break-words">{value}</span>
      )}
    </div>
  );
}

// ============================================
// SOUS-COMPOSANT : AVATAR INITIALES
// ============================================

function ProfessionalAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div
      className="w-14 h-14 rounded-full bg-derviche flex items-center justify-center shrink-0"
      aria-hidden="true"
    >
      <span className="text-white font-semibold text-lg leading-none">
        {initials || '?'}
      </span>
    </div>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function ProfessionalDetailPage({ params }: PageProps) {
  const { id: professionalId } = use(params);
  const router = useRouter();

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [isLoadingPro, setIsLoadingPro] = useState(true);
  const [errorPro, setErrorPro] = useState<string | null>(null);

  const [history, setHistory] = useState<ProfessionalReservationHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);

  // ---- Chargement du profil ----
  const loadProfessional = useCallback(async () => {
    setIsLoadingPro(true);
    setErrorPro(null);

    const supabase = createClient();

    // Query du profil sans embed reservations (ambiguité FK)
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, email, first_name, last_name,
        phone, email2, phone2, function, structure,
        afc_number, address, postal_code, city, country,
        comments, gdpr_consent, created_at, last_login_at,
        disabled_at
      `)
      .eq('id', professionalId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      logger.error('ProfessionalDetailPage: profil non trouvé', { professionalId, error: error?.message });
      setErrorPro('Professionnel introuvable');
      setIsLoadingPro(false);
      return;
    }

    // Count séparé pour éviter l'ambiguité de FK (profiles ↔ reservations)
    const { count: reservationCount } = await supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', professionalId);

    setProfessional({ ...data, reservation_count: reservationCount ?? 0 } as Professional);
    setIsLoadingPro(false);
  }, [professionalId]);

  // ---- Chargement de l'historique ----
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    setErrorHistory(null);

    try {
      const response = await fetch(
        `/api/admin/professionals/${professionalId}/history`
      );
      const result = (await response.json()) as {
        success: boolean;
        data?: ProfessionalReservationHistoryEntry[];
        error?: string;
      };

      if (!result.success) {
        setErrorHistory(result.error ?? 'Erreur lors du chargement');
      } else {
        setHistory(result.data ?? []);
      }
    } catch {
      setErrorHistory('Erreur réseau');
    }

    setIsLoadingHistory(false);
  }, [professionalId]);

  useEffect(() => {
    void loadProfessional();
    void loadHistory();
  }, [loadProfessional, loadHistory]);

  // ---- Infos dérivées ----
  const fullName = professional
    ? [professional.first_name, professional.last_name].filter(Boolean).join(' ')
    : '';
  const displayName = fullName || professional?.email || '…';
  const isActive = professional ? professional.disabled_at === null : true;

  const address = professional
    ? [
        professional.address,
        [professional.postal_code, professional.city].filter(Boolean).join(' '),
        professional.country && professional.country !== 'France'
          ? professional.country
          : null,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  // ---- Stats historique ----
  const totalConfirmed = history.filter((r) => r.reservation_status === 'confirmed').length;
  const totalPresent = history.filter(
    (r) =>
      r.checkin_status === 'present_neutral' ||
      r.checkin_status === 'present_loved' ||
      r.checkin_status === 'present_press'
  ).length;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ---- Breadcrumb ---- */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/admin/professionnels"
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Professionnels
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-xs">
          {isLoadingPro ? '…' : displayName}
        </span>
      </div>

      {/* ---- Chargement pro ---- */}
      {isLoadingPro && (
        <div className="flex items-center gap-2 text-muted-foreground py-10">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Chargement du profil…</span>
        </div>
      )}

      {/* ---- Erreur pro ---- */}
      {!isLoadingPro && errorPro && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm text-red-700">{errorPro}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/professionnels')}
              className="h-7 px-2 text-red-700"
            >
              Retour à la liste
            </Button>
          </div>
        </div>
      )}

      {/* ---- Contenu principal ---- */}
      {!isLoadingPro && professional && (
        <>
          {/* ---- En-tête fiche ---- */}
          <div className="flex items-start gap-4 p-6 bg-card border rounded-xl">
            <ProfessionalAvatar name={displayName} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h1 className="text-xl font-semibold leading-tight">{displayName}</h1>
                  {fullName && (
                    <p className="text-sm text-muted-foreground mt-0.5">{professional.email}</p>
                  )}
                  {professional.structure && (
                    <p className="text-sm text-muted-foreground">{professional.structure}</p>
                  )}
                </div>
                <Badge
                  className={`text-xs mt-1 ${
                    isActive
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}
                  variant="outline"
                >
                  {isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>

              {/* Petites stats */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                <span>
                  <strong className="text-foreground">{history.length}</strong> réservation{history.length > 1 ? 's' : ''}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span>
                  <strong className="text-foreground">{totalConfirmed}</strong> confirmée{totalConfirmed > 1 ? 's' : ''}
                </span>
                {totalPresent > 0 && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span>
                      <strong className="text-foreground">{totalPresent}</strong> présence{totalPresent > 1 ? 's' : ''} validée{totalPresent > 1 ? 's' : ''}
                    </span>
                  </>
                )}
                {professional.created_at && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span>Inscrit le {formatDate(professional.created_at)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ---- Grille : Infos + Historique ---- */}
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

            {/* ---- Colonne gauche : informations ---- */}
            <div className="space-y-5 p-5 bg-card border rounded-xl h-fit">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Informations
              </h2>

              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                  Professionnel
                </p>
                <InfoRow icon={Building2} label="Structure" value={professional.structure} />
                <InfoRow icon={IdCard} label="Fonction" value={professional.function} />
                <InfoRow icon={IdCard} label="N° AFC" value={professional.afc_number} />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                  Contact
                </p>
                <InfoRow icon={Mail} label="Email" value={professional.email} isEmail />
                <InfoRow icon={Mail} label="Email secondaire" value={professional.email2} isEmail />
                <InfoRow icon={Phone} label="Téléphone" value={professional.phone} />
                <InfoRow icon={Phone} label="Tél. secondaire" value={professional.phone2} />
              </div>

              {address && (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                    Adresse
                  </p>
                  <InfoRow icon={MapPin} label="Adresse" value={address} />
                </div>
              )}

              {professional.comments && (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                    Notes internes
                  </p>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 whitespace-pre-wrap">
                    {professional.comments}
                  </p>
                </div>
              )}

              {/* Retour vers la liste */}
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <Link href="/admin/professionnels">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                    Retour à la liste
                  </Link>
                </Button>
              </div>
            </div>

            {/* ---- Colonne droite : historique des réservations ---- */}
            <div className="p-5 bg-card border rounded-xl">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Historique des réservations
                </h2>
                {!isLoadingHistory && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => void loadHistory()}
                    aria-label="Actualiser"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Chargement */}
              {isLoadingHistory && (
                <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Chargement de l&apos;historique…</span>
                </div>
              )}

              {/* Erreur */}
              {!isLoadingHistory && errorHistory && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm text-red-700">{errorHistory}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void loadHistory()}
                      className="h-7 px-2 text-red-700 hover:bg-red-100"
                    >
                      <RefreshCw className="h-3 w-3 mr-1.5" />
                      Réessayer
                    </Button>
                  </div>
                </div>
              )}

              {/* Vide */}
              {!isLoadingHistory && !errorHistory && history.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-10">
                  Aucune réservation enregistrée
                </p>
              )}

              {/* Tableau */}
              {!isLoadingHistory && !errorHistory && history.length > 0 && (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Spectacle</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut résa</TableHead>
                        <TableHead>Checkin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((entry) => {
                        const resaConfig =
                          RESERVATION_STATUS_CONFIG[entry.reservation_status];
                        const checkinConfig = entry.checkin_status
                          ? CHECKIN_STATUS_CONFIG[entry.checkin_status]
                          : null;

                        return (
                          <TableRow
                            key={entry.reservation_id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            {/* Spectacle */}
                            <TableCell className="font-medium text-sm">
                              {entry.show_title}
                            </TableCell>

                            {/* Date + heure */}
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {formatDate(entry.slot_date)}
                              <span className="ml-1 text-xs">
                                {formatTime(entry.slot_time)}
                              </span>
                            </TableCell>

                            {/* Statut réservation */}
                            <TableCell>
                              <Badge
                                className={`text-[10px] px-1.5 py-0 h-4 ${resaConfig.className}`}
                                variant="outline"
                              >
                                {resaConfig.label}
                              </Badge>
                            </TableCell>

                            {/* Statut checkin */}
                            <TableCell>
                              {checkinConfig ? (
                                <Badge
                                  className={`text-[10px] px-1.5 py-0 h-4 ${checkinConfig.className}`}
                                  variant="outline"
                                >
                                  {checkinConfig.label}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
