/**
 * Composant ProfessionalDrawer - Panneau détail d'un professionnel
 * Derviche Diffusion
 */

'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  Hash,
} from 'lucide-react';
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
// COMPOSANT UTILITAIRE : LIGNE D'INFO
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
    <div className="flex items-start gap-3 py-2 border-b border-muted/50 last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {isEmail ? (
          <a
            href={`mailto:${value}`}
            className="text-sm font-medium hover:underline text-derviche"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// SOUS-COMPOSANT : ONGLET INFORMATIONS
// ============================================

function ProfessionalInfoTab({
  professional,
  onUpdate,
  isSubmitting,
}: {
  professional: Professional;
  onUpdate: (id: string, data: UpdateProfessionalData) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleUpdate = async (data: UpdateProfessionalData) => {
    setFormError(null);
    try {
      await onUpdate(professional.id, data);
      setIsEditing(false);
    } catch {
      setFormError('Erreur lors de la mise à jour');
    }
  };

  if (isEditing) {
    return (
      <ProfessionalEditForm
        professional={professional}
        onSubmit={async (data) => { await handleUpdate(data); }}
        onCancel={() => setIsEditing(false)}
        isSubmitting={isSubmitting}
        formError={formError}
      />
    );
  }

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
      {/* Bouton Modifier */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setIsEditing(true)}
      >
        <Pencil className="h-3.5 w-3.5 mr-1.5" />
        {LABELS.EDIT}
      </Button>

      {/* Bloc : informations professionnelles */}
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
          Professionnel
        </p>
        <div className="space-y-0.5">
          <InfoRow icon={Building2} label="Structure" value={professional.structure} />
          <InfoRow icon={IdCard} label="Fonction" value={professional.function} />
          <InfoRow icon={IdCard} label="N° AFC" value={professional.afc_number} />
          {/* S174 — ID CRM Zoho, lecture seule (édition via le formulaire) */}
          <InfoRow icon={Hash} label="ID CRM (Zoho)" value={professional.crm_id} />
          {/* Session B — ID CRM Zoho de la structure du pro */}
          <InfoRow icon={Hash} label="ID CRM structure (Zoho)" value={professional.crm_structure_id} />
        </div>
      </div>

      {/* Bloc : contact */}
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
          Contact
        </p>
        <div className="space-y-0.5">
          <InfoRow icon={Mail} label="Email" value={professional.email} isEmail />
          <InfoRow
            icon={Mail}
            label="Email secondaire"
            value={professional.email2}
            isEmail
          />
          <InfoRow icon={Phone} label="Téléphone" value={professional.phone} />
          <InfoRow icon={Phone} label="Téléphone secondaire" value={professional.phone2} />
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

export function ProfessionalDrawer({
  professional,
  isOpen,
  onClose,
  onToggleStatus,
  onDelete,
  onUpdate,
  isSubmitting,
}: ProfessionalDrawerProps) {
  if (!professional) return null;

  const isActive = professional.disabled_at === null;
  const statusClass = isActive
    ? STATUS_BADGE_CLASSES.active
    : STATUS_BADGE_CLASSES.inactive;
  const statusLabel = isActive ? LABELS.ACTIVE : LABELS.INACTIVE;
  const fullName = [professional.first_name, professional.last_name]
    .filter(Boolean)
    .join(' ');

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto flex flex-col"
      >
        {/* ---- En-tête ---- */}
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg truncate">
                {fullName || professional.email}
              </SheetTitle>
              {fullName && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {professional.email}
                </p>
              )}
              <Badge className={`text-xs mt-2 ${statusClass}`} variant="outline">
                {statusLabel}
              </Badge>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="flex gap-2 pt-2">
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
        </SheetHeader>

        {/* ---- Corps ---- */}
        <div className="flex-1 pt-4">
          <Tabs defaultValue="info">
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

            {/* Onglet Informations */}
            <TabsContent value="info">
              <ProfessionalInfoTab
                professional={professional}
                onUpdate={onUpdate}
                isSubmitting={isSubmitting}
              />
            </TabsContent>

            {/* Onglet Réservations */}
            <TabsContent value="reservations">
              <ProfessionalReservations
                professionalId={professional.id}
                professionalName={fullName || professional.email}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
