/**
 * Validate a Cape Verde NIF (Número de Identificação Fiscal).
 * Rules: exactly 9 numeric digits. Field is optional — empty string is valid.
 */
export function validateNIF(nif) {
  if (!nif || nif.trim() === '') return true;
  return /^\d{9}$/.test(nif.trim());
}

export function nifErrorMessage() {
  return 'NIF deve ter exactamente 9 dígitos';
}
