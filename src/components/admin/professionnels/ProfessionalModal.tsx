/**
 * Composant ProfessionalModal - Modal détail d'un professionnel
 * Derviche Diffusion
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Pencil,
  UserCheck,
  UserX,
  Trash2,
  IdCard,
  ClipboardList,
  Hash,
} from 'lucide-react';
import Link from 'next/link';
import { copyEmailWithToast } from '@/lib/utils/copy-email';
import { ProfessionalEditForm } from './ProfessionalEditForm';
import { ProfessionalReservations } from './ProfessionalReservations';
import type {
  ProfessionalDrawerProps,
  Professional,
  UpdateProfessionalData,
} from '@/app/admin/professionnels/types';
import {
  STATUS_BADGE_CLASSES,
  LABELS,
  DRAWER_TABS,
} from '@/app/admin/professionnels/constants';

// ============================================
// COMPOSANT UTILITAIRE : AVATAR INITIALES
// ============================================

function ProfessionalAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <div
      className="w-12 h-12 rounded-full bg-derviche flex items-center justify-center shrink-0"
      aria-hidden="true"
    >
      <span className="text-white font-semibold text-base leading-none">
        {initials || '?'}
      </span>
    </div>
  );
}

// ============================================
// COMPOSANT UTILITAIRE : LIGNE D'INFO (layout horizontal)
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
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
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
// SOUS-COMPOSANT : ONGLET INFORMATIONS (lecture seule)
// ============================================

function ProfessionalInfoTab({ professional }: { professional: Professional }) {
  const address = [
    professional.address,
    [professional.postal_code, professional.city].filter(Boolean).join(' '),
    professional.country && professional.country !== 'France'
      ? professional.country
      : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-5">
      {/* Bloc : informations professionnelles */}
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
          Professionnel
        </p>
        <div>
          <InfoRow icon={Building2} label="Structure" value={professional.structure} />
          <InfoRow icon={IdCard} label="Fonction" value={professional.function} />
          <InfoRow icon={IdCard} label="N° AFC" value={professional.afc_number} />
          {/* S174 — ID CRM Zoho, lecture seule (édition via le formulaire) */}
          <InfoRow icon={Hash} label="ID CRM (Zoho)" value={professional.crm_id} />
        </div>
      </div>

      {/* Bloc : contact */}
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
          Contact
        </p>
        <div>
          <InfoRow icon={Mail} label="Email" value={professional.email} isEmail />
          <InfoRow icon={Mail} label="Email secondaire" value={professional.email2} isEmail />
          <InfoRow icon={Phone} label="Téléphone" value={professional.phone} />
          <InfoRow icon={Phone} label="Tél. secondaire" value={professional.phone2} />
        </div>
      </div>

      {/* Bloc : adresse */}
      {address && (
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
            Adresse
          </p>
          <InfoRow icon={MapPin} label="Adresse complète" value={address} />
        </div>
      )}

      {/* Bloc : notes internes */}
      {professional.comments && (
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
            Notes internes
          </p>
          <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 whitespace-pre-wrap">
            {professional.comments}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function ProfessionalModal({
  professional,
  isOpen,
  onClose,
  onToggleStatus,
  onDelete,
  onUpdate,
  isSubmitting,
}: ProfessionalDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!professional) return null;

  const isActive = professional.disabled_at === null;
  const statusClass = isActive
    ? STATUS_BADGE_CLASSES.active
    : STATUS_BADGE_CLASSES.inactive;
  const statusLabel = isActive ? LABELS.ACTIVE : LABELS.INACTIVE;
  const fullName = [professional.first_name, professional.last_name]
    .filter(Boolean)
    .join(' ');
  const displayName = fullName || professional.email;

  const handleUpdate = async (data: UpdateProfessionalData) => {
    setFormError(null);
    try {
      await onUpdate(professional.id, data);
      setIsEditing(false);
    } catch {
      setFormError('Erreur lors de la mise à jour');
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setFormError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto [&>button]:cursor-pointer">

        {/* ---- En-tête ---- */}
        <DialogHeader className="pb-4 border-b">

          {/* Ligne principale : avatar + identité + crayon */}
          <div className="flex items-start gap-3">
            <ProfessionalAvatar name={displayName} />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <DialogTitle className="text-base font-semibold truncate leading-tight">
                    {displayName}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Détails du professionnel {displayName}
                  </DialogDescription>
                  {fullName && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {professional.email}
                    </p>
                  )}
                  {professional.structure && (
                    <p className="text-xs text-muted-foreground truncate">
                      {professional.structure}
                    </p>
                  )}
                </div>


              </div>

              {/* Badge statut */}
              <Badge className={`text-xs mt-2 ${statusClass}`} variant="outline">
                {statusLabel}
              </Badge>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="flex gap-2 pt-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-derviche border-derviche/30 hover:bg-derviche/5 hover:text-derviche"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              {LABELS.EDIT}
            </Button>

            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/admin/professionnels/${professional.id}`}>
                <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                Fiche complète
              </Link>
            </Button>

            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a
                href={`mailto:${professional.email}`}
                onClick={() => void copyEmailWithToast(professional.email)}
              >
                <Mail className="h-3.5 w-3.5 mr-1.5" />
                {LABELS.EMAIL_CONTACT}
              </a>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={`flex-1 ${
                isActive
                  ? 'text-orange-600 hover:text-orange-600'
                  : 'text-green-600 hover:text-green-600'
              }`}
              onClick={() => onToggleStatus(professional)}
              disabled={isSubmitting}
            >
              {isActive ? (
                <>
                  <UserX className="h-3.5 w-3.5 mr-1.5" />
                  {LABELS.DEACTIVATE}
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                  {LABELS.ACTIVATE}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(professional)}
              disabled={isSubmitting}
              aria-label={LABELS.DELETE}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DialogHeader>

        {/* ---- Corps ---- */}
        <div className="pt-4">
          <Tabs defaultValue="info" onValueChange={() => setIsEditing(false)}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="info" className="flex-1">
                {DRAWER_TABS.info}
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex-1">
                {DRAWER_TABS.reservations}
                {professional.reservation_count > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-derviche/10 text-derviche text-xs w-5 h-5 font-semibold">
                    {professional.reservation_count}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              {isEditing ? (
                <ProfessionalEditForm
                  professional={professional}
                  onSubmit={handleUpdate}
                  onCancel={() => { setIsEditing(false); setFormError(null); }}
                  isSubmitting={isSubmitting}
                  formError={formError}
                />
              ) : (
                <ProfessionalInfoTab professional={professional} />
              )}
            </TabsContent>

            <TabsContent value="reservations">
              <ProfessionalReservations
                professionalId={professional.id}
                professionalName={displayName}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
