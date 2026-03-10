/**
 * Dialog unifié Compagnie — création et édition
 * Remplace CompanyFormDialog + CompanyViewDialog
 * S160 — Refactorisation UX (1 dialog, 2 onglets)
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  MapPin,
  Theater,
  ArrowRight,
  Globe,
  KeyRound,
  UserPlus,
  User,
  CheckCircle,
  XCircle,
  UserMinus,
  RefreshCw,
  Mail,
  Phone,
} from 'lucide-react';
import type { CompanyWithShowsCount } from '@/lib/services/companies';
import type { ManagedUser } from '@/lib/services/internal-users';
import type { CompanyFormData } from './company-form-dialog';

export type { CompanyFormData };

// ============================================================================
// Constantes et helpers (identiques à company-form-dialog)
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const defaultFormData: CompanyFormData = {
  name: '',
  contact_email: '',
  description: '',
  city: '',
  contact_name: '',
  contact_phone: '',
  website: '',
};

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function sanitizeFormData(data: CompanyFormData): CompanyFormData {
  return {
    name: data.name.trim(),
    contact_email: data.contact_email?.trim() || null,
    description: data.description?.trim() || null,
    city: data.city?.trim() || null,
    contact_name: data.contact_name?.trim() || null,
    contact_phone: data.contact_phone?.trim() || null,
    website: data.website?.trim() || null,
  };
}

// ============================================================================
// Types
// ============================================================================

type ActiveTab = 'informations' | 'acces';

export interface CompanyDialogProps {
  /** Contrôle l'ouverture */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Compagnie en édition — null = mode création */
  company: CompanyWithShowsCount | null;
  /** Callback soumission formulaire */
  onSubmit: (data: CompanyFormData, isEditing: boolean) => Promise<void>;
  isSubmitting?: boolean;
  /** Erreur serveur à afficher dans le formulaire */
  error?: string | null;
  /** Callback suppression (footer gauche, mode édition uniquement) */
  onDelete?: () => void;
  /** Nombre de spectacles de la compagnie */
  showsCount?: number;
  /** Callback voir les spectacles */
  onViewShows?: () => void;
  /** Utilisateur lié */
  companyUser?: ManagedUser | null;
  isLoadingUser?: boolean;
  onCreateUser?: () => void;
  onAssignUser?: () => void;
  onChangeUser?: () => Promise<void>;
  onUnlinkUser?: () => void;
  isProcessing?: boolean;
}

// ============================================================================
// Sous-composant : formulaire d'informations
// ============================================================================

interface InformationsFormProps {
  formData: CompanyFormData;
  validationErrors: Record<string, string>;
  isSubmitting: boolean;
  error: string | null;
  onFieldChange: (field: keyof CompanyFormData, value: string | null) => void;
}

function InformationsForm({
  formData,
  validationErrors,
  isSubmitting,
  error,
  onFieldChange,
}: InformationsFormProps) {
  return (
    <div className="space-y-4 py-4 px-1">
      {/* Erreur serveur */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Nom */}
      <div className="space-y-2">
        <Label htmlFor="company-name">
          Nom de la compagnie <span className="text-destructive">*</span>
        </Label>
        <Input
          id="company-name"
          value={formData.name ?? ''}
          onChange={(e) => onFieldChange('name', e.target.value)}
          placeholder="Ex: Compagnie du Soleil"
          disabled={isSubmitting}
          className={validationErrors.name ? 'border-destructive' : ''}
        />
        {validationErrors.name && (
          <p className="text-sm text-destructive">{validationErrors.name}</p>
        )}
      </div>

      {/* Ville */}
      <div className="space-y-2">
        <Label htmlFor="company-city">Ville</Label>
        <Input
          id="company-city"
          value={formData.city ?? ''}
          onChange={(e) => onFieldChange('city', e.target.value)}
          placeholder="Ex: Lyon"
          disabled={isSubmitting}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="company-description">Description</Label>
        <Textarea
          id="company-description"
          value={formData.description ?? ''}
          onChange={(e) => onFieldChange('description', e.target.value)}
          placeholder="Présentation de la compagnie..."
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      {/* Site web */}
      <div className="space-y-2">
        <Label htmlFor="company-website">Site web</Label>
        <Input
          id="company-website"
          type="url"
          value={formData.website ?? ''}
          onChange={(e) => onFieldChange('website', e.target.value)}
          placeholder="https://www.compagnie.fr"
          disabled={isSubmitting}
        />
      </div>

      {/* Contact */}
      <div className="space-y-2">
        <Label htmlFor="company-contact-name">Nom du contact</Label>
        <Input
          id="company-contact-name"
          value={formData.contact_name ?? ''}
          onChange={(e) => onFieldChange('contact_name', e.target.value)}
          placeholder="Ex: Jean Dupont"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company-contact-email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="company-contact-email"
            type="email"
            value={formData.contact_email ?? ''}
            onChange={(e) => onFieldChange('contact_email', e.target.value)}
            placeholder="contact@compagnie.fr"
            disabled={isSubmitting}
            className={validationErrors.contact_email ? 'border-destructive' : ''}
          />
          {validationErrors.contact_email && (
            <p className="text-sm text-destructive">{validationErrors.contact_email}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-contact-phone">Téléphone</Label>
          <Input
            id="company-contact-phone"
            type="tel"
            value={formData.contact_phone ?? ''}
            onChange={(e) => onFieldChange('contact_phone', e.target.value || null)}
            placeholder="01 23 45 67 89"
            disabled={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sous-composant : onglet accès plateforme
// ============================================================================

interface AccesPlateformeSectionProps {
  company: CompanyWithShowsCount;
  showsCount: number;
  onViewShows?: () => void;
  companyUser?: ManagedUser | null;
  isLoadingUser: boolean;
  onCreateUser?: () => void;
  onAssignUser?: () => void;
  onChangeUser?: () => Promise<void>;
  onUnlinkUser?: () => void;
  isProcessing: boolean;
}

function AccesPlateformeSection({
  company,
  showsCount,
  onViewShows,
  companyUser,
  isLoadingUser,
  onCreateUser,
  onAssignUser,
  onChangeUser,
  onUnlinkUser,
  isProcessing,
}: AccesPlateformeSectionProps) {
  return (
    <div className="space-y-6 py-4 px-1">
      {/* Spectacles liés */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Spectacles</h4>
        <div className="flex items-center gap-2">
          <Badge
            className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20"
            onClick={onViewShows}
          >
            <Theater className="w-3 h-3 mr-1" />
            {showsCount} spectacle{showsCount > 1 ? 's' : ''}
          </Badge>
          {showsCount > 0 && onViewShows && (
            <Button
              variant="ghost"
              size="sm"
              className="text-derviche hover:text-derviche"
              onClick={onViewShows}
            >
              Voir les spectacles
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Accès utilisateur plateforme */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
          <KeyRound className="w-4 h-4" />
          Compte utilisateur
        </h4>

        {isLoadingUser ? (
          <p className="text-sm text-muted-foreground animate-pulse">Chargement...</p>
        ) : companyUser ? (
          /* Utilisateur existant */
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Compte actif</span>
              {companyUser.disabled_at && (
                <Badge
                  variant="outline"
                  className="text-orange-600 border-orange-300 text-xs"
                >
                  Désactivé
                </Badge>
              )}
            </div>
            <div className="space-y-1 text-sm">
              {(companyUser.first_name || companyUser.last_name) && (
                <p className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  {[companyUser.first_name, companyUser.last_name].filter(Boolean).join(' ')}
                </p>
              )}
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-green-700">{companyUser.email}</span>
              </p>
              {companyUser.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  {companyUser.phone}
                </p>
              )}
            </div>

            {(onChangeUser || onUnlinkUser) && (
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-green-200">
                {onChangeUser && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onChangeUser}
                    disabled={isProcessing}
                    className="flex-1 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Changer
                  </Button>
                )}
                {onUnlinkUser && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onUnlinkUser}
                    disabled={isProcessing}
                    className="flex-1 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                  >
                    <UserMinus className="w-3.5 h-3.5 mr-1.5" />
                    Dissocier
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Pas d'utilisateur */
          <div className="p-3 bg-muted/50 border border-dashed rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Aucun accès configuré</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              {onCreateUser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateUser}
                  className="flex-1"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer un accès
                </Button>
              )}
              {onAssignUser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAssignUser}
                  className="flex-1"
                >
                  <User className="w-4 h-4 mr-2" />
                  Assigner un existant
                </Button>
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-2">
          Cet accès permet à la compagnie de consulter ses réservations sur la plateforme.
        </p>
      </div>

      {/* Infos contact métier (lecture seule) */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-1">Contact métier</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Contact pour l&apos;organisation des spectacles (différent du compte plateforme).
          Modifiable dans l&apos;onglet Informations.
        </p>
        <div className="space-y-2">
          {company.contact_name && (
            <p className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              {company.contact_name}
            </p>
          )}
          {company.contact_email && (
            <p className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a
                href={`mailto:${company.contact_email}`}
                className="text-derviche hover:underline"
              >
                {company.contact_email}
              </a>
            </p>
          )}
          {company.contact_phone && (
            <p className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <a
                href={`tel:${company.contact_phone}`}
                className="text-derviche hover:underline"
              >
                {company.contact_phone}
              </a>
            </p>
          )}
          {company.website && (
            <p className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-derviche hover:underline"
              >
                {company.website}
              </a>
            </p>
          )}
          {!company.contact_name && !company.contact_email && !company.contact_phone && (
            <span className="text-sm text-muted-foreground italic">
              Aucun contact renseigné
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Composant principal
// ============================================================================

export function CompanyDialog({
  open,
  onOpenChange,
  company,
  onSubmit,
  isSubmitting = false,
  error = null,
  onDelete,
  showsCount = 0,
  onViewShows,
  companyUser,
  isLoadingUser = false,
  onCreateUser,
  onAssignUser,
  onChangeUser,
  onUnlinkUser,
  isProcessing = false,
}: CompanyDialogProps) {
  const isEditing = company !== null;

  const [activeTab, setActiveTab] = useState<ActiveTab>('informations');
  const [formData, setFormData] = useState<CompanyFormData>(defaultFormData);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialiser le formulaire à chaque ouverture
  useEffect(() => {
    if (open) {
      setActiveTab('informations');
      setValidationErrors({});
      if (company) {
        setFormData({
          name: company.name,
          contact_email: company.contact_email,
          description: company.description || '',
          city: company.city || '',
          contact_name: company.contact_name || '',
          contact_phone: company.contact_phone || '',
          website: company.website || '',
        });
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [open, company]);

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Le nom est obligatoire';
        break;
      case 'contact_email':
        if (!value.trim()) return "L'email est obligatoire";
        if (!isValidEmail(value)) return "Format d'email invalide (ex: contact@exemple.fr)";
        break;
    }
    return null;
  };

  const handleFieldChange = (field: keyof CompanyFormData, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'name' || field === 'contact_email') {
      const fieldError = validateField(field, value || '');
      setValidationErrors((prev) => {
        if (fieldError) return { ...prev, [field]: fieldError };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [field]: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const nameError = validateField('name', formData.name);
    if (nameError) errors.name = nameError;
    const emailError = validateField('contact_email', formData.contact_email ?? '');
    if (emailError) errors.contact_email = emailError;
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    await onSubmit(sanitizeFormData(formData), isEditing);
  };

  const handleClose = () => {
    setFormData(defaultFormData);
    setValidationErrors({});
    onOpenChange(false);
  };

  const isFormValid =
    formData.name.trim() &&
    (formData.contact_email ?? '').trim() &&
    isValidEmail((formData.contact_email ?? '').trim());

  const isOnAccessTab = activeTab === 'acces';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? company.name : 'Ajouter une compagnie'}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            {isEditing && company.city ? (
              <>
                <MapPin className="w-4 h-4" />
                {company.city}
              </>
            ) : isEditing ? (
              'Modifier la compagnie'
            ) : (
              'Remplissez les informations pour créer une nouvelle compagnie.'
            )}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          /* Mode édition — 2 onglets */
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as ActiveTab)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2 shrink-0">
              <TabsTrigger value="informations">Informations</TabsTrigger>
              <TabsTrigger value="acces" className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Accès plateforme
                {!isLoadingUser && (
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${
                      companyUser ? 'bg-green-500' : 'bg-muted-foreground/40'
                    }`}
                  />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="informations" className="flex-1 overflow-y-auto mt-0">
              <InformationsForm
                formData={formData}
                validationErrors={validationErrors}
                isSubmitting={isSubmitting}
                error={error}
                onFieldChange={handleFieldChange}
              />
            </TabsContent>

            <TabsContent value="acces" className="flex-1 overflow-y-auto mt-0">
              <AccesPlateformeSection
                company={company}
                showsCount={showsCount}
                onViewShows={onViewShows}
                companyUser={companyUser}
                isLoadingUser={isLoadingUser}
                onCreateUser={onCreateUser}
                onAssignUser={onAssignUser}
                onChangeUser={onChangeUser}
                onUnlinkUser={onUnlinkUser}
                isProcessing={isProcessing}
              />
            </TabsContent>
          </Tabs>
        ) : (
          /* Mode création — formulaire seul */
          <div className="flex-1 overflow-y-auto">
            <InformationsForm
              formData={formData}
              validationErrors={validationErrors}
              isSubmitting={isSubmitting}
              error={error}
              onFieldChange={handleFieldChange}
            />
          </div>
        )}

        <DialogFooter className="border-t pt-4 mt-2 flex flex-col sm:flex-row gap-2">
          {/* Suppression — édition uniquement, gauche */}
          {isEditing && onDelete && (
            <Button
              variant="outline"
              onClick={onDelete}
              disabled={isSubmitting || isProcessing}
              className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Supprimer
            </Button>
          )}

          <div className="flex-1" />

          {/* Annuler / Fermer */}
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isOnAccessTab ? 'Fermer' : 'Annuler'}
          </Button>

          {/* Sauvegarder — masqué sur l'onglet accès */}
          {!isOnAccessTab && (
            <Button
              onClick={() => void handleSubmit()}
              disabled={!isFormValid || isSubmitting}
              className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
            >
              {isSubmitting
                ? 'Enregistrement...'
                : isEditing
                  ? 'Modifier'
                  : 'Créer'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
