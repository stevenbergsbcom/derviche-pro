/**
 * API Route - Création d'utilisateurs internes et compagnies
 * POST /api/admin/users
 * 
 * Crée un nouvel utilisateur géré par les admins :
 * - Internes : super-admin, admin, externe
 * - Compagnies : company (avec company_id obligatoire)
 * 
 * Si l'email existe déjà avec un compte supprimé (soft delete),
 * le compte est réactivé automatiquement.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';
import { isValidManagedRole } from '@/lib/services/internal-users';
import { logger } from '@/lib/logger';
import type { ManagedRole } from '@/lib/services/internal-users';

// ============================================
// TYPES
// ============================================

interface CreateUserRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: ManagedRole;
  company_id?: string; // Obligatoire si role = 'company'
  must_change_password?: boolean;
}

interface CreateUserResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
  };
  reactivated?: boolean; // Indique si c'est une réactivation
  error?: string;
}

// ============================================
// HELPERS
// ============================================

/**
 * Pause l'exécution pendant un nombre de millisecondes
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// VALIDATION
// ============================================

function validateRequest(data: unknown): { valid: true; data: CreateUserRequest } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Données invalides' };
  }

  const body = data as Record<string, unknown>;

  // Email requis
  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    return { valid: false, error: 'Email invalide' };
  }

  // Password requis avec règles Supabase
  if (!body.password || typeof body.password !== 'string') {
    return { valid: false, error: 'Mot de passe requis' };
  }

  const password = body.password;
  if (password.length < 10) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins 10 caractères' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins une majuscule' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins une minuscule' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins un chiffre' };
  }

  // Rôle requis et valide (inclut maintenant 'company')
  if (!body.role || typeof body.role !== 'string' || !isValidManagedRole(body.role)) {
    return { valid: false, error: 'Rôle invalide. Valeurs acceptées: super-admin, admin, externe, company' };
  }

  const role = body.role as ManagedRole;

  // company_id obligatoire si role = 'company'
  if (role === 'company') {
    if (!body.company_id || typeof body.company_id !== 'string') {
      return { valid: false, error: 'Le company_id est obligatoire pour le rôle compagnie' };
    }
  }

  return {
    valid: true,
    data: {
      email: body.email.trim().toLowerCase(),
      password: body.password,
      first_name: typeof body.first_name === 'string' ? body.first_name.trim() || undefined : undefined,
      last_name: typeof body.last_name === 'string' ? body.last_name.trim() || undefined : undefined,
      phone: typeof body.phone === 'string' ? body.phone.trim() || undefined : undefined,
      role,
      company_id: typeof body.company_id === 'string' ? body.company_id.trim() || undefined : undefined,
      must_change_password: body.must_change_password === true,
    },
  };
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: Request): Promise<NextResponse<CreateUserResponse>> {
  try {
    logger.info('API /admin/users - Début création utilisateur');

    // 1. Vérifier que l'appelant est authentifié et a les droits admin
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      logger.warn('API /admin/users - Non authentifié');
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur a un rôle admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .in('role', ['super-admin', 'admin'])
      .single();

    if (!roleData) {
      logger.warn('API /admin/users - Droits insuffisants', { userId: currentUser.id });
      return NextResponse.json(
        { success: false, error: 'Droits insuffisants' },
        { status: 403 }
      );
    }

    // 2. Parser et valider la requête
    const body = await request.json();
    const validation = validateRequest(body);

    if (!validation.valid) {
      logger.warn('API /admin/users - Validation échouée', { error: validation.error });
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { email, password, first_name, last_name, phone, role, company_id, must_change_password } = validation.data;

    const supabaseAdmin = createAdminClient();

    // 3. Si role = 'company', vérifier que la compagnie existe et n'a pas déjà d'utilisateur
    if (role === 'company' && company_id) {
      // Vérifier que la compagnie existe
      const { data: companyData, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('id, name')
        .eq('id', company_id)
        .is('deleted_at', null)
        .single();

      if (companyError || !companyData) {
        logger.warn('API /admin/users - Compagnie non trouvée', { company_id });
        return NextResponse.json(
          { success: false, error: 'Compagnie non trouvée' },
          { status: 400 }
        );
      }

      // Vérifier qu'aucun utilisateur avec rôle 'company' n'est déjà associé à cette compagnie
      // Important: On filtre sur le rôle pour éviter de compter les admins/externes
      // qui auraient un company_id assigné pour d'autres raisons
      
      // Étape 1: Récupérer les user_ids qui ont le rôle 'company'
      const { data: companyRoleUsers } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'company');

      const companyUserIds = (companyRoleUsers || []).map(u => u.user_id);

      // Étape 2: Vérifier si un de ces utilisateurs est associé à cette compagnie
      let existingCompanyUser: { id: string; email: string } | null = null;

      if (companyUserIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .eq('company_id', company_id)
          .is('deleted_at', null)
          .in('id', companyUserIds)
          .maybeSingle();
        
        existingCompanyUser = data;
      }

      if (existingCompanyUser) {
        logger.warn('API /admin/users - Compagnie a déjà un utilisateur', { 
          company_id, 
          existingUserId: existingCompanyUser.id 
        });
        return NextResponse.json(
          { success: false, error: `Cette compagnie a déjà un accès utilisateur (${existingCompanyUser.email})` },
          { status: 400 }
        );
      }

      logger.info('API /admin/users - Compagnie validée', { company_id, companyName: companyData.name });
    }

    // 4. Vérifier si un compte supprimé existe avec cet email
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, deleted_at')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      logger.error('API /admin/users - Erreur vérification profil existant', { error: profileError.message });
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la vérification de l\'email' },
        { status: 500 }
      );
    }

    // Si un profil existe avec deleted_at, on réactive le compte
    if (existingProfile && existingProfile.deleted_at) {
      logger.info('API /admin/users - Compte supprimé trouvé, réactivation', { 
        userId: existingProfile.id, 
        email 
      });

      const userId = existingProfile.id;

      // 1. D'abord mettre à jour le mot de passe (opération la plus susceptible d'échouer)
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
      });

      if (passwordError) {
        logger.error('API /admin/users - Erreur mise à jour mot de passe', { error: passwordError.message });
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la mise à jour du mot de passe' },
          { status: 500 }
        );
      }

      // 2. Ensuite réactiver le profil (seulement si le mot de passe a été mis à jour)
      const { error: reactivateError } = await supabaseAdmin
        .from('profiles')
        .update({
          deleted_at: null,
          disabled_at: null, // Réactiver aussi si le compte était désactivé
          first_name: first_name || null,
          last_name: last_name || null,
          phone: phone || null,
          company_id: company_id || null, // Associer la compagnie si fournie
          must_change_password: must_change_password ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (reactivateError) {
        logger.error('API /admin/users - Erreur réactivation profil', { error: reactivateError.message });
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la réactivation du compte' },
          { status: 500 }
        );
      }

      // 3. Mettre à jour le rôle
      const { error: roleUpdateError } = await supabaseAdmin
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (roleUpdateError) {
        logger.warn('API /admin/users - Update rôle échoué, tentative insert', { error: roleUpdateError.message });
        
        const { error: insertRoleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userId,
            role,
          });

        if (insertRoleError) {
          logger.error('API /admin/users - Erreur création rôle lors réactivation', { 
            error: insertRoleError.message,
            code: insertRoleError.code
          });
          return NextResponse.json(
            { success: false, error: 'Erreur lors de l\'attribution du rôle' },
            { status: 500 }
          );
        }
      }

      logger.info('API /admin/users - Compte réactivé avec succès', { userId, email, role, company_id });

      return NextResponse.json({
        success: true,
        reactivated: true,
        user: {
          id: userId,
          email,
        },
      });
    }

    // Si un profil actif existe déjà, erreur
    if (existingProfile && !existingProfile.deleted_at) {
      logger.warn('API /admin/users - Email déjà utilisé par un compte actif', { email });
      return NextResponse.json(
        { success: false, error: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // 5. Créer l'utilisateur avec le client admin
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        first_name,
        last_name,
      },
    });

    if (createError || !newUser.user) {
      logger.error('API /admin/users - Erreur création auth', { 
        error: createError?.message,
        code: createError?.code,
        status: createError?.status,
        email 
      });
      
      // Message d'erreur user-friendly
      let errorMessage = 'Erreur lors de la création du compte';
      if (createError?.message?.includes('already registered') || createError?.message?.includes('already been registered')) {
        errorMessage = 'Cet email est déjà utilisé';
      } else if (createError?.message?.includes('invalid') && createError?.message?.includes('email')) {
        errorMessage = 'Format d\'email invalide';
      }
      // Note: On ne renvoie plus createError.message au client pour des raisons de sécurité
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    const userId = newUser.user.id;
    logger.info('API /admin/users - Utilisateur auth créé', { userId, email });

    // 6. Attendre que le trigger Supabase crée le profil
    await sleep(500);

    // 7. Mettre à jour ou créer le profil (upsert pour être sûr)
    const { error: profileUpsertError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        first_name: first_name || null,
        last_name: last_name || null,
        phone: phone || null,
        company_id: company_id || null, // Associer la compagnie si fournie
        must_change_password: must_change_password ?? false,
      }, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (profileUpsertError) {
      logger.error('API /admin/users - Erreur upsert profil', { 
        error: profileUpsertError.message, 
        code: profileUpsertError.code,
        details: profileUpsertError.details 
      });
      // Rollback : supprimer l'utilisateur auth créé pour éviter un état incohérent
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création du profil utilisateur' },
        { status: 500 }
      );
    }
    
    logger.info('API /admin/users - Profil créé/mis à jour', { userId, company_id });

    // 8. Mettre à jour le rôle (le trigger a peut-être créé un rôle par défaut)
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .update({ role })
      .eq('user_id', userId);

    // Si l'update n'a rien modifié (pas de rôle existant), on insère
    if (roleError) {
      logger.warn('API /admin/users - Update rôle échoué, tentative insert', { error: roleError.message });
      
      const { error: insertRoleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role,
        });

      if (insertRoleError) {
        logger.error('API /admin/users - Erreur création rôle', { 
          error: insertRoleError.message,
          code: insertRoleError.code,
          details: insertRoleError.details
        });
        // Rollback : supprimer l'utilisateur auth et profil créés pour éviter un état incohérent
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { success: false, error: 'Erreur lors de l\'attribution du rôle' },
          { status: 500 }
        );
      }
    }

    logger.info('API /admin/users - Rôle créé', { userId, role });
    logger.info('API /admin/users - Succès complet', { userId, email, role, company_id });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
      },
    });

  } catch (error) {
    logger.error('API /admin/users - Exception', { error });
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
