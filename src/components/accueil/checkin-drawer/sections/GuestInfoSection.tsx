/**
 * GuestInfoSection - Formulaire d'informations du professionnel
 * Derviche Diffusion
 * 
 * Section dépliable contenant 14 champs éditables
 * UX mobile : h-12 text-base, champs empilés, icônes w-4 h-4
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
  Globe,
  CreditCard,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import type { GuestFormState } from '../types';

// ============================================
// TYPES
// ============================================

export interface GuestInfoSectionProps {
  guestForm: GuestFormState;
  detailsOpen: boolean;
  isSubmitting: boolean;
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
  onCountryChange: (value: string) => void;
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
  onCountryChange,
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
            <User className="w-4 h-4" aria-hidden="true" />
            Informations du professionnel
          </span>
          <ChevronDown className={cn(
            'w-4 h-4 transition-transform',
            detailsOpen && 'rotate-180'
          )} aria-hidden="true" />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent id="guest-info-content" className="mt-3 space-y-4">

        {/* Prénom */}
        <div className="space-y-2">
          <label htmlFor="guest-first-name" className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
            <User className="w-4 h-4" aria-hidden="true" />
            Prénom *
          </label>
          <Input
            id="guest-first-name"
            value={guestForm.firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="Prénom"
            disabled={isSubmitting}
            className="h-12 text-base"
            inputMode="text"
            autoComplete="given-name"
          />
        </div>

        {/* Nom */}
        <div className="space-y-2">
          <label htmlFor="guest-last-name" className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
            <User className="w-4 h-4" aria-hidden="true" />
            Nom *
          </label>
          <Input
            id="guest-last-name"
            value={guestForm.lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="Nom"
            disabled={isSubmitting}
            className="h-12 text-base"
            inputMode="text"
            autoComplete="family-name"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="guest-email" className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
            <Mail className="w-4 h-4" aria-hidden="true" />
            Email *
          </label>
          <Input
            id="guest-email"
            type="email"
            value={guestForm.email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="email@exemple.com"
            disabled={isSubmitting}
            className="h-12 text-base"
            inputMode="email"
            autoComplete="email"
          />
        </div>

        {/* Email secondaire */}
        <div className="space-y-2">
          <label htmlFor="guest-email-secondary" className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
            <Mail className="w-4 h-4" aria-hidden="true" />
            Email secondaire
          </label>
          <Input
            id="guest-email-secondary"
            type="email"
            value={guestForm.emailSecondary}
            onChange={(e) => onEmailSecondaryChange(e.target.value)}
            placeholder="autre@exemple.com"
            disabled={isSubmitting}
            className="h-12 text-base"
            inputMode="email"
            autoComplete="email"
          />
        </div>

        {/* Téléphone */}
        <div className="space-y-2">
          <label htmlFor="guest-phone" className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
            <Phone className="w-4 h-4" aria-hidden="true" />
            Téléphone
          </label>
          <Input
            id="guest-phone"
            type="tel"
            value={guestForm.phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="06 12 34 56 78"
            disabled={isSubmitting}
            className="h-12 text-base"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>

        {/* Téléphone secondaire */}
        <div className="space-y-2">
          <label htmlFor="guest-phone-secondary" className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
            <Phone className="w-4 h-4" aria-hidden="true" />
            Téléphone secondaire
          </label>
          <Input
            id="guest-phone-secondary"
            type="tel"
            value={guestForm.phoneSecondary}
            onChange={(e) => onPhoneSecondaryChange(e.target.value)}
            placeholder="01 23 45 67 89"
            disabled={isSubmitting}
            className="h-12 text-base"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>

        {/* Structure */}
        <div className="space-y-2">
          <label htmlFor="guest-structure" className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
            <Building2 className="w-4 h-4" aria-hidden="true" />
            Structure / Organisation
          </label>
          <Input
            id="guest-structure"
            value={guestForm.structure}
            onChange={(e) => onStructureChange(e.target.value)}
            placeholder="Théâtre, Centre culturel..."
            disabled={isSubmitting}
            className="h-12 text-base"
          />
        </div>

        {/* Fonction */}
        <div className="space-y-2">
          <label htmlFor="guest-function" className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
            <Briefcase className="w-4 h-4" aria-hidden="true" />
            Fonction
          </label>
          <Input
            id="guest-function"
            value={guestForm.function}
            onChange={(e) => onFunctionChange(e.target.value)}
            placeholder="Professionnel·le, Directeur·rice..."
            disabled={isSubmitting}
            className="h-12 text-base"
          />
        </div>

        {/* Adresse */}
        <div className="space-y-2">
          <label htmlFor="guest-address" className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
            <Home className="w-4 h-4" aria-hidden="true" />
            Adresse
          </label>
          <Input
            id="guest-address"
            value={guestForm.address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="12 rue du Théâtre"
            disabled={isSubmitting}
            className="h-12 text-base"
            autoComplete="street-address"
          />
        </div>

        {/* Code postal */}
        <div className="space-y-2">
          <label htmlFor="guest-postal-code" className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
            <Home className="w-4 h-4" aria-hidden="true" />
            Code postal
          </label>
          <Input
            id="guest-postal-code"
            value={guestForm.postalCode}
            onChange={(e) => onPostalCodeChange(e.target.value)}
            placeholder="75001"
            disabled={isSubmitting}
            className="h-12 text-base"
            inputMode="numeric"
            autoComplete="postal-code"
          />
        </div>

        {/* Ville */}
        <div className="space-y-2">
          <label htmlFor="guest-city" className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
            <Home className="w-4 h-4" aria-hidden="true" />
            Ville
          </label>
          <Input
            id="guest-city"
            value={guestForm.city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Paris"
            disabled={isSubmitting}
            className="h-12 text-base"
            autoComplete="address-level2"
          />
        </div>

        {/* Pays */}
        <div className="space-y-2">
          <label htmlFor="guest-country" className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
            <Globe className="w-4 h-4" aria-hidden="true" />
            Pays
          </label>
          <Input
            id="guest-country"
            value={guestForm.country}
            onChange={(e) => onCountryChange(e.target.value)}
            placeholder="France"
            disabled={isSubmitting}
            className="h-12 text-base"
            autoComplete="country-name"
          />
        </div>

        {/* Numéro AFC */}
        <div className="space-y-2">
          <label htmlFor="guest-afc-number" className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
            <CreditCard className="w-4 h-4" aria-hidden="true" />
            Numéro AFC
          </label>
          <Input
            id="guest-afc-number"
            value={guestForm.afcNumber}
            onChange={(e) => onAfcNumberChange(e.target.value)}
            placeholder="Numéro d'adhérent AFC"
            disabled={isSubmitting}
            className="h-12 text-base"
          />
        </div>

        {/* Demandes spéciales */}
        <div className="space-y-2">
          <label htmlFor="guest-special-requests" className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            Demandes spéciales
          </label>
          <p className="text-xs text-muted-foreground">Saisi par le professionnel lors de la réservation</p>
          <Textarea
            id="guest-special-requests"
            value={guestForm.specialRequests}
            onChange={(e) => onSpecialRequestsChange(e.target.value)}
            placeholder="Accessibilité, accompagnant, etc."
            rows={3}
            disabled={isSubmitting}
            className="resize-none text-base"
          />
        </div>

      </CollapsibleContent>
    </Collapsible>
  );
}
