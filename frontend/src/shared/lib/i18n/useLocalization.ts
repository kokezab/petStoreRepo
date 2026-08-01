import { useCallback } from 'react';

/**
 * Minimal standalone i18n so this example runs without extra dependencies.
 *
 * TO INTEGRATE WITH YOUR REAL I18N (e.g. react-i18next):
 *   import { useTranslation } from 'react-i18next';
 *   export function useLocalization() {
 *     const { t } = useTranslation();
 *     return { t };
 *   }
 * Every other file in this codebase only depends on the `{ t }` shape, so
 * swapping this file's internals is the only change required.
 */

// Generic chrome strings owned by the Codebook component itself.
// Domain strings (entity titles, field labels, validation, lock reasons)
// live in your real i18n resources under their own namespaces/keys.
const resources: Record<string, string> = {
  'codebook.add': 'Add',
  'codebook.edit': 'Edit',
  'codebook.delete': 'Delete',
  'codebook.confirmDelete': 'Delete this item?',
  'codebook.createTitle': 'Create {{entity}}',
  'codebook.editTitle': 'Edit {{entity}}',
  'codebook.lockedField': 'This action is not available for this record right now',
  'codebook.discardChangesTitle': 'Discard changes?',
  'codebook.discardChangesBody': 'You have unsaved changes that will be lost.',
  'codebook.discard': 'Discard',
  'codebook.keepEditing': 'Keep editing',

  'validation.required': 'This field is required',
  'validation.invalid': 'Invalid value',
  'validation.tooLong': 'Value is too long',

  'countries.title': 'Countries',
  'countries.entityName': 'Country',
  'countries.fields.name': 'Name',
  'countries.fields.code': 'Code',
  'countries.fields.status': 'Status',
  'countries.validation.codeLength': 'Code must be exactly 3 letters',
  'countries.permissions.cannotEditDone': 'Cannot edit a country marked as done',
  'countries.permissions.cannotDeleteDone': 'Cannot delete a country marked as done',

  'equipment.title': 'Equipment',
  'equipment.entityName': 'Equipment',
  'equipment.fields.name': 'Name',
  'equipment.fields.code': 'Code',
  'equipment.fields.status': 'Status',
  'equipment.permissions.cannotEditDone': 'Cannot edit equipment marked as done',
  'equipment.permissions.cannotDeleteDone': 'Cannot delete equipment marked as done',

  'company.title': 'Companies',
  'company.entityName': 'Company',
  'company.fields.name': 'Name',
  'company.fields.shortName': 'Short name',
  'company.fields.additionalInfo': 'Additional info',
  'company.fields.active': 'Active',
  'company.active.yes': 'Yes',
  'company.active.no': 'No',
};

type Vars = Record<string, string | number>;

function interpolate(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => String(vars[key] ?? `{{${key}}}`));
}

export function useLocalization() {
  const t = useCallback((key: string, vars?: Vars) => {
    const template = resources[key] ?? key; // fallback to the key itself so missing translations are visible, not blank
    return interpolate(template, vars);
  }, []);

  return { t };
}
