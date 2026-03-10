/**
 * DataResetSection — Remise à zéro des données transactionnelles
 * Derviche Diffusion
 *
 * Permet au super-admin de vider les données de test avant
 * de passer en test utilisateurs ou en production.
 * Demande la saisie de "RESET" avant d'exécuter.
 */

'use client';

import { useState, useCallback } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button }   from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast }       from 'sonner';
import { resetData }   from '@/lib/services/maintenance';
import type { ResetOptions } from '@/lib/services/maintenance';

// ============================================
// CONSTANTES
// ============================================

const CONFIRM_WORD = 'RESET';

// Tables toujours supprimées (non modifiables)
const FIXED_ITEMS = [
  'Réservations',
  'Notifications admin',
  'Emails envoyés',
  'Emails checkin',
] as const;

// ============================================
// COMPOSANT
// ============================================

export function DataResetSection() {
  // Options optionnelles
  const [options, setOptions] = useState<ResetOptions>({
    profiles:    true,
    showsAndSlots: true,
    authUsers:   true,
  });

  // Dialog + confirmation
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isResetting,  setIsResetting]  = useState(false);

  const isConfirmValid = confirmInput.trim() === CONFIRM_WORD;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOptionChange = useCallback((key: keyof ResetOptions, value: boolean) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const openDialog = useCallback(() => {
    setConfirmInput('');
    setDialogOpen(true);
  }, []);

  const handleReset = useCallback(async () => {
    if (!isConfirmValid) return;
    setIsResetting(true);
    try {
      const result = await resetData(options);
      if (!result.success) {
        toast.error(result.error ?? 'Erreur lors de la remise à zéro');
        return;
      }

      // Résumé des suppressions
      const counts = result.deleted ?? {};
      const total  = Object.values(counts).reduce((sum, n) => sum + n, 0);
      toast.success(`Remise à zéro effectuée — ${total} ligne${total > 1 ? 's' : ''} supprimée${total > 1 ? 's' : ''}`);

      setDialogOpen(false);
      // Petit délai puis reload pour refléter l'état vide
      setTimeout(() => { window.location.reload(); }, 1200);
    } finally {
      setIsResetting(false);
    }
  }, [isConfirmValid, options]);

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-red-700">
            <AlertTriangle className="size-4" />
            Remise à zéro des données
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Supprime définitivement les données transactionnelles. À utiliser avant
            de passer en test utilisateurs ou en production. Irréversible.
          </p>

          {/* Tables obligatoires */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Toujours supprimé
            </p>
            <div className="rounded-md border bg-muted/40 px-4 py-3 space-y-2">
              {FIXED_ITEMS.map(label => (
                <div key={label} className="flex items-center gap-3">
                  <Checkbox checked disabled aria-label={label} />
                  <Label className="text-sm text-muted-foreground cursor-default">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Tables optionnelles */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Au choix
            </p>
            <div className="rounded-md border px-4 py-3 space-y-3">

              <div className="flex items-start gap-3">
                <Checkbox
                  id="opt-profiles"
                  checked={options.profiles}
                  onCheckedChange={v => handleOptionChange('profiles', v === true)}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="opt-profiles" className="text-sm cursor-pointer">
                    Profils professionnels &amp; compagnies
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Les comptes super-admin, admin et externe ne sont pas touchés.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="opt-shows"
                  checked={options.showsAndSlots}
                  onCheckedChange={v => handleOptionChange('showsAndSlots', v === true)}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="opt-shows" className="text-sm cursor-pointer">
                    Spectacles, créneaux &amp; lieux
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Supprime toute la programmation. Les catégories et compagnies sont conservées.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="opt-auth"
                  checked={options.authUsers}
                  onCheckedChange={v => handleOptionChange('authUsers', v === true)}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="opt-auth" className="text-sm cursor-pointer">
                    Comptes Auth Supabase (pro &amp; company)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Supprime les accès de connexion. Recommandé si les profils sont supprimés.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bouton d'ouverture du dialog */}
          <Button
            variant="destructive"
            className="gap-2 w-full sm:w-auto"
            onClick={openDialog}
          >
            <RotateCcw className="size-4" />
            Réinitialiser les données
          </Button>
        </CardContent>
      </Card>

      {/* Dialog de confirmation */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="size-5" />
              Confirmer la remise à zéro
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-1">
              <span className="block">
                Cette action est <strong>irréversible</strong>. Les données suivantes
                seront définitivement supprimées :
              </span>
              <ul className="list-disc list-inside text-sm space-y-0.5 text-foreground">
                {FIXED_ITEMS.map(l => <li key={l}>{l}</li>)}
                {options.profiles    && <li>Profils professionnels &amp; compagnies</li>}
                {options.showsAndSlots && <li>Spectacles, créneaux &amp; lieux</li>}
                {options.authUsers   && <li>Comptes Auth Supabase (pro &amp; company)</li>}
              </ul>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="confirm-reset" className="text-sm font-medium">
              Tapez <strong className="font-mono">{CONFIRM_WORD}</strong> pour confirmer
            </Label>
            <Input
              id="confirm-reset"
              value={confirmInput}
              onChange={e => setConfirmInput(e.target.value)}
              placeholder={CONFIRM_WORD}
              className={isConfirmValid ? 'border-red-400 focus-visible:ring-red-400' : ''}
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isResetting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleReset()}
              disabled={!isConfirmValid || isResetting}
            >
              {isResetting ? 'Suppression en cours…' : 'Confirmer la suppression'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
