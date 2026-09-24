# Cadrage : retours client du 17 septembre 2026

> Source de vérité pour la suite des travaux. Lu en début de session tant que le suivi ci-dessous n'est pas « terminé ».
> Rédigé le 17/09/2026 après audit du code par 5 explorations + comptages prod en lecture seule. Mail de questions envoyé à la cliente le 17/09 (14 questions, section 6). En attente de ses réponses.

## 0. Suivi

| Date | Événement |
|---|---|
| 17/09 | Mail client reçu (18 demandes en 5 blocs). Cadrage complet. Hotfix D1 livré en prod (main `3da594a`). Mail de 14 questions envoyé. |
| ... | Réponses de la cliente : à reporter ici, question par question. |

**Règles de travail rappelées** : Steven applique toutes les migrations à la main (je crée les fichiers, jamais d'exécution sur prod) ; jamais de merge sans « go merge » explicite ; plan avant code pour toute feature ; audit avant tests/merge ; quality gate `npm run type-check && npm run lint && npm run build` ; doc MDX à jour dans le même commit (règle CLAUDE.md) ; jamais « programmateur » (toujours « professionnel ») ; pas de tiret cadratin dans les textes rédigés. Lectures seules sur prod via `.env.local` acceptées sur demande explicite (« go »), jamais d'écriture.

**Décision cliente déjà prise** : pas de nettoyage des anciens événements Google Calendar orphelins (on ne touche pas au passé).

## 1. Chiffres prod (17/09/2026, lecture seule)

| Donnée | Valeur |
|---|---|
| Réservations | 1 073, dont 77 annulées |
| Notes accueil (`checkin_comment`) | 173 (du 5 mai au 23 juillet) |
| Notes lieu | 345 |
| Notes internes | 736 |
| Annulées portant encore un `google_calendar_event_id` | 57 (non fiable : l'id n'est jamais remis à NULL même après suppression Google) |
| Compagnies actives | 24, toutes avec `contact_email` |
| Lieux actifs | 212 (7 sans adresse, créés via le mini-dialog) |
| Spectacles / créneaux | 28 / 810 |

## 2. Les 18 demandes, constats et propositions

Pastilles : 🟢 simple, 🟡 moyen, 🔴 long. Numérotation A1..E3 utilisée partout.

### Bloc A : spectacle
- **A1 🟢 Renommer « dossier de presse » → « dossier artistique »**. Colonne `shows.folder_url` (nom neutre, aucune migration de schéma). Libellés : `spectacle-form-dialog/components/MediaSection.tsx:35`, `spectacle-view-dialog/components/MediaResourcesSection.tsx:55,60`, `email-template-form/index.tsx:379,383`, `useEmailTemplateForm.ts:70`, `preview/route.ts:241`, MDX `spectacles/enrichir.mdx`, `spectacles/creer-publier.mdx:40`, `checkin-pwa/emails-post-accueil.mdx:52`, CLAUDE.md. Donnée : `email_templates.folder_link_text` (défaut « Consulter le dossier de presse ») → migration UPDATE uniquement des valeurs encore égales au défaut.
- **A2/A3 🟡 Liens « dossier pédagogique » et « fiche technique »** (fiche spectacle + mail merci). Modèle à dupliquer : `derviche_site_url` (migrations 107 + 108/112, `MediaSection.tsx:69-83`, `public-catalog/queries.ts:256,399`, `public-catalog/types.ts:76`, `show-detail-sidebar.tsx:192-205`, `send-checkin-followup/route.ts:174,255`, `builders/simple.ts:131-135`). Pattern liens optionnels email = migration 071 (`show_x_link` bool + `x_link_text`), composant `OptionalLinkToggle`, 9 points de passage (schema zod form, defaults RHF, UI toggle, route PATCH, preview, fallbacks, types, service update). Toggles OFF par défaut → aucun mail existant ne change. Le dossier artistique n'est PAS sur la fiche publique (décision migration 083). Dépend de Q1.

### Bloc B : dates de tournée
- **B1 🔴 Import fichier lieux + dates**. Rien n'existe (aucun import dans `src/`). `xlsx` ^0.18.5 déjà installé (écriture seule aujourd'hui, `XLSX.read` dispo). Contraintes : aucune unicité sur `venues` (dédoublonnage applicatif nom+ville normalisés) ; trigger `validate_slot_date` (006:208) refuse `date < CURRENT_DATE` ; `UNIQUE(show_id, venue_id, date, time)` sur slots ; `hosted_by` et `capacity` obligatoires ; `getVenues()` sans limite (plafond PostgREST 1000, on est à 212). Réutilisable : `createSlotBatch` → `createMultipleRepresentations` (`representations.ts:186-216`), aperçu avec statuts par ligne comme `generate-series-dialog`. Dépend de Q3/Q4 (unique vs récurrent ; format fichier).
- **B2 🟢 Autocomplete lieu**. `VenueSelector.tsx` = `Select` shadcn sans recherche. Combobox maison existant : `admin/statistiques/components/filters/multi-select-combobox.tsx` (utilisé par `venue-filter.tsx`), à décliner en sélection simple. `ui/command.tsx` (cmdk) installé mais jamais importé. À appliquer dans `representation-form-dialog` ET `generate-series-dialog` (`VenueSection`). Garder l'entrée « Créer un nouveau lieu » (`NEW_VENUE_VALUE`).
- **B3 🟢 Création rapide de lieu complète**. `venue-quick-create-dialog.tsx` ne demande que name+city ; `address`/`postal_code` nullables depuis migration 016. Ajouter les 2 champs (+ `capacity` si Q2 = oui). Insertion : `useSlotCrud.ts:363-378` → `createVenue`.

### Bloc C : demandes d'invitation
- **C1 🟢 Google Cal sans mail de confirmation**. Couplage UX, pas technique (pas de .ics ; invitation via API Google `events.insert`, pro en attendee, `sendUpdates`). 3 verrous : `notification-switches.tsx:53-59` (forçage) et `:130` (disabled), garde serveur `send-confirmation-by-id/route.ts:283` (`syncCalendar && !skipEmail`), appelant `admin/reservations/page.tsx:344-352`. Mêmes couplages à découpler : annulation (`cancel-dialog`, `page.tsx:255-282` n'appelle send-cancellation que si sendEmail → événement Google jamais supprimé sinon), modification (`page.tsx:300-320`), PWA (`useAddReservation.ts:231-240`, `useCheckinActions.ts:263-272`, transfert). Auto-décochage créneau passé (`useCreateReservationForm.ts:154-165`) à conserver. Pas de nettoyage du passé (décision cliente).
- **C2 🟡 Compagnie en copie du Google Cal par spectacle**. Aucune préférence par spectacle n'existe (pas de table `show_settings`). `companies.contact_email` inutilisé aujourd'hui (24/24 renseignés). Attendees construits dans `google-calendar/queries.ts:118` (`[{ email: guestEmail }]`), `events.update` reconstruit le corps complet. Prévoir `guestsCanSeeOtherGuests: false`. Conséquence : une invitation Google par réservation pour la compagnie. Dépend de Q5.
- **C3 🟢 Modification email → mise à jour invité Google**. Aujourd'hui update seulement si `slotChanged` (`page.tsx:300-320`, switches masqués sinon `edit-reservation-dialog/index.tsx:94,260`). Titre événement = `"{showTitle} – {guestFullName} (N places)"` (`queries.ts:90-91`) → nom et places aussi périmés. Proposition : déclencher `updateCalendarEvent` sur changement email/nom/places/créneau, via un chemin calendrier seul (sans mail de modification) quand seul l'email change.
- **C4 🟡 Réactiver / modifier une annulée**. `reactivateReservation` existe (PWA, `checkin/cancel-execution.ts:178-300`, `CancelledBanner.tsx`), pas dans l'admin. À porter dans `edit-reservation-dialog` + corriger : ne remet pas `cancelled_at`/`cancellation_reason` à NULL. RPC `update_reservation_safe` (066) refuse `status='cancelled'` → recommandation « réactiver puis modifier » (Q6). Garde-fous absents : `validate_reservation` = BEFORE INSERT seulement ; overbooking autorisé (033) ; doublons autorisés (095) → avertissement, pas blocage.
- **C5 🟡 Supprimer une réservation**. Rien n'existe (ni service, ni route, ni `.delete()`). RLS `reservations_all_admin` FOR ALL couvre déjà DELETE. FK : `sent_notifications` CASCADE, `checkin_followup_emails` CASCADE, `admin_notifications` SET NULL, `app_logs` SET NULL, aucun RESTRICT. Trigger 033 cas 3 : recrédit uniquement si `OLD.status != 'cancelled'`. Recommandation : RPC `delete_cancelled_reservation` (garde statut côté serveur), admin/super-admin, confirmation explicite (Q7).

### Bloc D : retours des pros à l'accueil
- **D1 🔴→✅ LIVRÉ 17/09** (main `3da594a`, commits dev `bbb75c2` + `a8f1857`). Cause : `handleAutoSaveStatus` envoyait `comment: null, venueNotes: null` → NULL en base à chaque clic statut. Correctif : notes courantes envoyées avec le statut, auto-save notes au blur + 1,5 s, `savedReservation` comme référence, sérialisation des auto-saves. Validé par harnais Vitest temporaire (10/10, T1 échoue contre l'ancien code). Doc `pointer-presents.mdx` mise à jour. Données perdues avant : irrécupérables.
- **D2 🟡 Supprimer « note accueil »**. `checkin_comment` : 173 valeurs en prod. Recommandation : garder la colonne, retirer de l'UI, migration de fusion dans `checkin_internal_notes` préfixée « [Accueil] » (Q8). Compagnies : c'était leur champ principal (elles ne voient pas les internes) → Q9. ~25 points : drawer PWA `NotesSection`, walk-in `CheckinFieldsSection` + zod, admin edit/create `NotesSection`, `table-cell-renderer` admin+company, les 3 mappings export admin (`table-cell-renderer.tsx`, `export-dialog/utils.ts`, `hooks/admin-reservations/helpers/formatters.ts`) + 2 company, `user-preferences/types.ts+constants.ts` (préférences de colonnes sauvegardées par utilisateur → filtrer la clé retirée), MDX. Occasion de solder la dette « 3 switches dupliqués » (task_0cd5ff47).
- **D3 🟡 Étape Zoho (menu déroulant)**. Aucune notion d'étape n'existe. Colonne `reservations.zoho_stage TEXT` + `CHECK IN (12 valeurs)` (pattern projet, pas d'ENUM), défaut « 1.0 DEMANDE D'INVIT » pour les nouvelles. Existant : vide recommandé (Q10). Mise à jour directe comme `crm_id` (pas de modif RPC). Visibilité staff DD recommandée (Q11). Colonne + filtre + export. Liste (12) : 0.0 DEMANDE D'INFO ; 1.0 DEMANDE D'INVIT ; 1.2 Retour pro obtenu ; 2.0 DEMANDE DE DEVIS ; 3.0 DEMANDE D'OPTION ; 3.1 Option posée ; 4.0 PERDU saison en cours - relancer ; Fermé - Gagné ; Fermé - Géré par la Cie (coréa, exclu...) ; Fermé - Ne programme pas (presse, prescripteurs...) ; Fermé - Perdu ; Fermé - Transféré à un autre contact.
- **D4 🟢 Champ « À faire »**. Nature à préciser (Q12) : texte libre, case à cocher filtrable, ou les deux.

### Bloc E : exports
- **E1 🟢 Nombre de places en nombre**. `getCellValue` renvoie toujours `string` ; `aoa_to_sheet` écrit des cellules `s`. Fix ciblé dans `export-excel.ts` admin (`:77-99`) et `company-reservations/export-helpers.ts` (`:237-240`) : cellule `{ t: 'n' }` pour `numPlaces`. CSV déjà correct.
- **E2 🟢 Smiley joyeux**. Valeur `present_neutral` inchangée. 😐 : `hooks/admin-reservations/constants.ts:68-73`, `company/reservations/constants.ts:77-84`, `company/reservations/components/stats-cards.tsx:121-123` ; icône `Meh` : `reservation-badges.tsx:10,45`. Proposer 🙂 / `Smile`. Renommer « Neutre » → « Présent » (Q13) : `translations.ts:28-33`, `export-dialog/constants.ts:57-62`, company idem, `slot-group.tsx:42-47`, `filters-section.tsx:121`.
- **E3 🟡 Export Excel des représentations**. Aucun export sur `admin/spectacles/[id]/representations`. Réutiliser `downloadExcel` (`lib/utils/export-helpers.ts`) + pattern `admin-stats/helpers/export-excel.ts:119-120`. Données : `getRepresentationsByShowId` (`venueCity` ramené mais non mappé dans `MockRepresentation`) ; stats par slot via RPC `get_show_detail_stats` (105). Pas de vue globale « toutes représentations » aujourd'hui (Q14).

## 3. Migrations prévues (toutes additives, appliquées avant déploiement)

| # | Objet | Bloc |
|---|---|---|
| 131 | `shows` : `pedagogical_file_url`, `technical_sheet_url` (nullables) | A2/A3 |
| 132 | `email_templates` : 2 toggles + 2 textes (OFF) ; UPDATE `folder_link_text` si égal au défaut | A1, A2/A3 |
| 133 | `reservations` : `zoho_stage` (CHECK, défaut), `todo` (selon Q12) | D3, D4 |
| 134 | Fusion `checkin_comment` → `checkin_internal_notes` (selon Q8) | D2 |
| 135 | RPC `delete_cancelled_reservation` | C5 |
| 136 | `shows.calendar_notify_company` (défaut false, selon Q5) | C2 |

Interdits volontaires : aucune colonne supprimée, aucune réécriture de `update_reservation_safe` ni `create_admin_reservation` (leçon migration 130).

## 4. Lots proposés (ordre annoncé à la cliente)

| Lot | Contenu | Statut |
|---|---|---|
| 0 | D1 hotfix | ✅ livré 17/09 |
| 1 | A1, B2, B3, C1, C3, E1, E2 | à démarrer dès réponses (Q2, Q13 seulement) |
| 2 | A2/A3 | dépend Q1 |
| 3 | D2 (+ dette 3 switches), D3, D4 | dépend Q8, Q9, Q10, Q11, Q12 |
| 4 | C4, C5 | dépend Q6, Q7 |
| 5 | C3 (si séparé), C2 | dépend Q5 |
| 6 | E3, B1 | dépend Q3, Q4, Q14 |

## 5. Ce que j'attends de la cliente : les 14 questions

| Q | Sujet | Réponse attendue | Ce que ça change | Réponse reçue |
|---|---|---|---|---|
| 1 | A2/A3 visibilité des liens | (a) tous visiteurs / (b) pros connectés / (c) email seulement. Recommandé (b) | (a)/(b) : fiche publique + sidebar ; (b) impose une vérif de session sur la page publique ; (c) : email seulement | |
| 2 | B3 jauge dans la création rapide | oui/non | ajoute `capacity` au mini-dialog | |
| 3 | B1 import lieux : ponctuel ou récurrent | ponctuel → script de chargement une fois (par Steven, depuis leur fichier) ; récurrent → écran d'import | taille du lot 6 divisée par deux si ponctuel | |
| 4 | B1 exemples de fichiers (lieux, dates) | fichiers Excel/CSV | définit les colonnes du modèle d'import | |
| 5 | C2 compagnie invitée à chaque résa | oui (attendee) / non / partage du calendrier | oui → migration 136 + attendees ; partage → rien à coder (config Google) | |
| 6 | C4 modifier une annulée | « réactiver puis modifier » suffit / éditer sans réactiver | second cas → migration RPC supplémentaire | |
| 7 | C5 suppression limitée aux annulées | oui/non | non → gestion capacité + Google Cal + décision sur les données de fréquentation | |
| 8 | D2 fusion des 173 notes dans notes internes « [Accueil] » | oui / autre destination | définit la migration 134 | |
| 9 | D2 compagnies gardent seulement « note lieu » | oui/non | non → garder le champ pour le rôle company | |
| 10 | D3 étape des réservations existantes | vide (recommandé) / « 1.0 » | UPDATE de backfill ou non | |
| 11 | D3 visibilité étape Zoho | staff DD seulement (recommandé) / compagnies aussi | gating `isStaffDD` + colonne company | |
| 12 | D4 nature du champ « À faire » | texte / case / les deux | colonnes de la migration 133 | |
| 13 | E2 renommer « Neutre » en « Présent » | oui/non | libellés tableaux + exports | |
| 14 | E3 export par spectacle / vue globale / les deux | | vue globale = nouvel écran (RPC 105 réutilisable) | |

## 6. Texte des questions tel qu'envoyé (17/09)

1. Où veux-tu voir les liens fiche technique / dossier pédagogique : (a) tous les visiteurs, (b) pros connectés, (c) mails de remerciement uniquement ?
2. Saisir aussi la jauge à la création rapide d'un lieu ?
3. L'import de lieux : ponctuel ou récurrent ? (si ponctuel, chargement fait une fois pour toi)
4. Peux-tu m'envoyer un exemple des fichiers à importer (lieux et dates) ?
5. La compagnie recevra un mail d'invitation Google par réservation : c'est bien ce que tu veux ? (alternative : partage du calendrier, mais elle verrait tous les spectacles)
6. Modifier une annulée : « réactiver puis modifier » suffit, ou modifier en la laissant annulée ?
7. Suppression limitée aux réservations déjà annulées (77) avec confirmation : suffisant ?
8. Recopier les 173 notes accueil dans « note interne Derviche » avec la mention [Accueil] ?
9. Les compagnies n'auront plus que « note sur le lieu » : OK ?
10. Réservations existantes : étape « 1.0 DEMANDE D'INVIT » ou vide (conseillé vide) ?
11. Étape Zoho réservée à l'équipe Derviche, ou visible par les compagnies ?
12. « À faire » : texte libre, case à cocher, ou les deux ?
13. Renommer « Neutre » en « Présent » ?
14. Export des représentations : par spectacle, vue globale, ou les deux ?
