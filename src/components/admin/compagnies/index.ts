// Composants de gestion des compagnies
// S160 — CompanyDialog remplace CompanyFormDialog + CompanyViewDialog

export { CompanyDialog } from './company-dialog/index';
export type { CompanyDialogProps, CompanyFormData } from './company-dialog/index';

// Conservés pour rétrocompatibilité éventuelle — non utilisés dans la page principale
export { CompanyFormDialog } from './company-form-dialog';
export type { CompanyFormDialogProps } from './company-form-dialog';

export { CompanyViewDialog } from './company-view-dialog';
export type { CompanyViewDialogProps } from './company-view-dialog';

export { CreateCompanyUserDialog } from './create-company-user-dialog';
export type { CreateCompanyUserDialogProps } from './create-company-user-dialog';

export { AssignCompanyUserDialog } from './assign-company-user-dialog';
export type { AssignCompanyUserDialogProps } from './assign-company-user-dialog';
