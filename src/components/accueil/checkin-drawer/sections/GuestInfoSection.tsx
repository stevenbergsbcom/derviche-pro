/**
 * GuestInfoSection - Formulaire d'informations du professionnel
 * Derviche Diffusion
 * 
 * Section dépliable contenant 13 champs éditables
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Home,
  CreditCard,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import type { GuestFormState } from '../types';

// ============================================
// TYPES
// ============================================

export interface GuestInfoSectionProps {
  /** État du formulaire guest */
  guestForm: GuestFormState;
  /** Section ouverte ou fermée */
  detailsOpen: boolean;
  /** En cours de traitement ? */
  isSubmitting: boolean;
  /** Callbacks de mise à jour */
  onDetailsOpenChange: (open: boolean) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onEmailSecondaryChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onPhoneSecondaryChange: (value: string) => void;
  onStructureChange: (value: string) => void;
  onFunctionChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onAfcNumberChange: (value: string) => void;
  onSpecialRequestsChange: (value: string) => void;
}

// ============================================
// COMPOSANT
// ============================================

export function GuestInfoSection({
  guestForm,
  detailsOpen,
  isSubmitting,
  onDetailsOpenChange,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onEmailSecondaryChange,
  onPhoneChange,
  onPhoneSecondaryChange,
  onStructureChange,
  onFunctionChange,
  onAddressChange,
  onPostalCodeChange,
  onCityChange,
  onAfcNumberChange,
  onSpecialRequestsChange,
}: GuestInfoSectionProps) {
  return (
    <Collapsible open={detailsOpen} onOpenChange={onDetailsOpenChange}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          aria-expanded={detailsOpen}
          aria-controls="guest-info-content"
          className="w-full justify-between text-muted-foreground -mx-2 px-2"
        >
          <span className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Informations du professionnel
          </span>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            detailsOpen && "rotate-180"
          )} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent id="guest-info-content" className="mt-3 space-y-4">
        {/* Prénom et Nom */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label 
              htmlFor="guest-first-name" 
              className="text-base font-medium text-muted-foreground mb-1 block"
            >
              Prénom *
            </label>
            <Input
              id="guest-first-name"
              value={guestForm.firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              placeholder="Prénom"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label 
              htmlFor="guest-last-name" 
              className="text-base font-medium text-muted-foreground mb-1 block"
            >
              Nom *
            </label>
            <Input
              id="guest-last-name"
              value={guestForm.lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              placeholder="Nom"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label 
            htmlFor="guest-email" 
            className="flex items-center gap-1.5 text-base font-medium text-muted-foreground mb-1"
          >
            <Mail className="w-3.5 h-3.5" />
            Email *
          </label>
          <Input
            id="guest-email"
            type="email"
            value={guestForm.email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="email@exemple.com"
            disabled={isSubmitting}
          />
        </div>

        {/* Email secondaire */}
        <div>
          <label 
            htmlFor="guest-email-secondary" 
            className="flex items-center gap-1.5 text-base font-medium text-muted-foreground mb-1"
          >
            <Mail className="w-3.5 h-3.5" />
            Email secondaire
          </label>
          <Input
            id="guest-email-secondary"
            type="email"
            value={guestForm.emailSecondary}
            onChange={(e) => onEmailSecondaryChange(e.target.value)}
            placeholder="autre@exemple.com"
            disabled={isSubmitting}
          />
        </div>

        {/* Téléphone */}
        <div>
          <label 
            htmlFor="guest-phone" 
            className="flex items-center gap-1.5 text-base font-medium text-muted-foreground mb-1"
          >
            <Phone className="w-3.5 h-3.5" />
            Téléphone
          </label>
          <Input
            id="guest-phone"
            type="tel"
            value={guestForm.phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="06 12 34 56 78"
            disabled={isSubmitting}
          />
        </div>

        {/* Téléphone secondaire */}
        <div>
          <label 
            htmlFor="guest-phone-secondary" 
            className="flex items-center gap-1.5 text-base font-medium text-muted-foreground mb-1"
          >
            <Phone className="w-3.5 h-3.5" />
            Téléphone secondaire
          </label>
          <Input
            id="guest-phone-secondary"
            type="tel"
            value={guestForm.phoneSecondary}
            onChange={(e) => onPhoneSecondaryChange(e.target.value)}
            placeholder="01 23 45 67 89"
            disabled={isSubmitting}
          />
        </div>

        {/* Structure */}
        <div>
          <label 
            htmlFor="guest-structure" 
            className="flex items-center gap-1.5 text-base font-medium text-muted-foreground mb-1"
          >
            <Building2 className="w-3.5 h-3.5" />
            Structure / Organisation
          </label>
          <Input
            id="guest-structure"
            value={guestForm.structure}
            onChange={(e) => onStructureChange(e.target.value)}
            placeholder="Théâtre, Centre culturel..."
            disabled={isSubmitting}
          />
        </div>

        {/* Fonction */}
        <div>
          <label 
            htmlFor="guest-function" 
            className="flex items-center gap-1.5 text-base font-medium text-muted-foreground mb-1"
          >
            <Briefcase className="w-3.5 h-3.5" />
            Fonction
          </label>
          <Input
            id="guest-function"
            value={guestForm.function}
            onChange={(e) => onFunctionChange(e.target.value)}
            placeholder="Programmateur, Directeur..."
            disabled={isSubmitting}
          />
        </div>

        {/* Adresse */}
        <div>
          <label 
            htmlFor="guest-address" 
            className="flex items-center gap-1.5 text-base font-medium text-muted-foreground mb-1"
          >
            <Home className="w-3.5 h-3.5" />
            Adresse
          </label>
          <Input
            id="guest-address"
            value={guestForm.address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="12 rue du Théâtre"
            disabled={isSubmitting}
          />
        </div>

        {/* Code postal et Ville */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label 
              htmlFor="guest-postal-code" 
              className="text-base font-medium text-muted-foreground mb-1 block"
            >
              Code postal
            </label>
            <Input
              id="guest-postal-code"
              value={guestForm.postalCode}
              onChange={(e) => onPostalCodeChange(e.target.value)}
              placeholder="75001"
              disabled={isSubmitting}
            />
          </div>
          <div className="col-span-2">
            <label 
              htmlFor="guest-city" 
              className="text-base font-medium text-muted-foreground mb-1 block"
            >
              Ville
            </label>
            <Input
              id="guest-city"
              value={guestForm.city}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder="Paris"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Numéro AFC */}
        <div>
          <label 
            htmlFor="guest-afc-number" 
            className="flex items-center gap-1.5 text-base font-medium text-muted-foreground mb-1"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Numéro AFC
          </label>
          <Input
            id="guest-afc-number"
            value={guestForm.afcNumber}
            onChange={(e) => onAfcNumberChange(e.target.value)}
            placeholder="Numéro d'adhérent AFC"
            disabled={isSubmitting}
          />
        </div>

        {/* Demandes spéciales */}
        <div>
          <label 
            htmlFor="guest-special-requests" 
            className="flex items-center gap-1.5 text-base font-medium text-muted-foreground mb-1"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Demandes spéciales
          </label>
          <Textarea
            id="guest-special-requests"
            value={guestForm.specialRequests}
            onChange={(e) => onSpecialRequestsChange(e.target.value)}
            placeholder="Accessibilité, accompagnant, etc."
            rows={2}
            disabled={isSubmitting}
            className="resize-none"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
