/**
 * Panneau d'informations de contact du professionnel
 * Colonne gauche : structure, contact, adresse, notes internes, bouton retour
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, IdCard, Mail, MapPin, Phone } from 'lucide-react';
import type { Professional } from '@/lib/services/professionals';
import { InfoRow } from './info-row';

interface ContactInfoPanelProps {
  /** Données du professionnel */
  professional: Professional;
  /** Adresse formatée complète */
  address: string;
}

/** Panneau latéral affichant les informations de contact et professionnelles */
export function ContactInfoPanel({ professional, address }: ContactInfoPanelProps) {
  return (
    <div className="h-fit space-y-5 rounded-xl border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Informations
      </h2>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Professionnel
        </p>
        <InfoRow icon={Building2} label="Structure" value={professional.structure} />
        <InfoRow icon={IdCard} label="Fonction" value={professional.function} />
        <InfoRow icon={IdCard} label="N° AFC" value={professional.afc_number} />
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Contact
        </p>
        <InfoRow icon={Mail} label="Email" value={professional.email} isEmail />
        <InfoRow icon={Mail} label="Email secondaire" value={professional.email2} isEmail />
        <InfoRow icon={Phone} label="Téléphone" value={professional.phone} />
        <InfoRow icon={Phone} label="Tél. secondaire" value={professional.phone2} />
      </div>

      {address && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Adresse
          </p>
          <InfoRow icon={MapPin} label="Adresse" value={address} />
        </div>
      )}

      {professional.comments && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Notes internes
          </p>
          <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            {professional.comments}
          </p>
        </div>
      )}

      {/* Retour vers la liste */}
      <div className="border-t pt-2">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/admin/professionnels">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Retour à la liste
          </Link>
        </Button>
      </div>
    </div>
  );
}
