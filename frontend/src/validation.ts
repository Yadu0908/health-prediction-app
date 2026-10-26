import type { FormValidationErrors, PatientFormData } from './types';


export const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
export const DOB_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/**
 * Validates a single field in real-time or during blur/change
 */
export function validateField(
  fieldName: keyof PatientFormData,
  value: string
): string | undefined {
  const trimmed = value.trim();

  switch (fieldName) {
    case 'full_name':
      if (!trimmed) {
        return 'Full name is required.';
      }
      if (trimmed.length < 2) {
        return 'Full name must be at least 2 characters.';
      }
      if (!/[a-zA-Z]/.test(trimmed)) {
        return 'Full name must contain alphabet letters.';
      }
      return undefined;

    case 'email':
      if (!trimmed) {
        return 'Email address is required.';
      }
      if (!EMAIL_REGEX.test(trimmed)) {
        return "Email must be a valid format containing '@' and a domain (e.g. name@domain.com).";
      }
      const parts = trimmed.split('@');
      if (parts.length !== 2 || !parts[1].includes('.') || parts[1].startsWith('.') || parts[1].endsWith('.')) {
        return 'Email must include a valid top-level domain.';
      }
      return undefined;

    case 'date_of_birth':
      if (!trimmed) {
        return 'Date of birth is required.';
      }
      const dobMatch = trimmed.match(DOB_REGEX);
      if (!dobMatch) {
        return 'Date of birth must be in dd/mm/yyyy format (e.g. 15/08/1990).';
      }

      const day = parseInt(dobMatch[1], 10);
      const month = parseInt(dobMatch[2], 10);
      const year = parseInt(dobMatch[3], 10);

      if (month < 1 || month > 12) {
        return 'Month must be between 01 and 12.';
      }

      if (year < 1900) {
        return 'Date of birth year cannot be earlier than 1900.';
      }

      // Check real calendar date validity (e.g., Nov 31 or Feb 29 on non-leap years)
      const dateObj = new Date(year, month - 1, day);
      if (
        dateObj.getFullYear() !== year ||
        dateObj.getMonth() !== month - 1 ||
        dateObj.getDate() !== day
      ) {
        return `Date ${trimmed} is not a real calendar date (e.g. month only has ${new Date(year, month, 0).getDate()} days).`;
      }

      // Future date check
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (dateObj > today) {
        return 'Date of birth cannot be a future date.';
      }

      return undefined;

    case 'glucose':
      if (!trimmed) {
        return 'Glucose level is required.';
      }
      const gVal = Number(trimmed);
      if (isNaN(gVal)) {
        return 'Glucose must be a numeric value.';
      }
      if (gVal <= 0) {
        return 'Glucose must be greater than 0 mg/dL.';
      }
      if (gVal > 1000) {
        return 'Glucose value exceeds reasonable clinical range (max 1000 mg/dL).';
      }
      return undefined;

    case 'haemoglobin':
      if (!trimmed) {
        return 'Haemoglobin level is required.';
      }
      const hVal = Number(trimmed);
      if (isNaN(hVal)) {
        return 'Haemoglobin must be a numeric value.';
      }
      if (hVal <= 0) {
        return 'Haemoglobin must be greater than 0 g/dL.';
      }
      if (hVal > 35) {
        return 'Haemoglobin exceeds typical clinical limit (max 35 g/dL).';
      }
      return undefined;

    case 'cholesterol':
      if (!trimmed) {
        return 'Cholesterol level is required.';
      }
      const cVal = Number(trimmed);
      if (isNaN(cVal)) {
        return 'Cholesterol must be a numeric value.';
      }
      if (cVal <= 0) {
        return 'Cholesterol must be greater than 0 mg/dL.';
      }
      if (cVal > 1000) {
        return 'Cholesterol value exceeds reasonable clinical range (max 1000 mg/dL).';
      }
      return undefined;

    default:
      return undefined;
  }
}

/**
 * Validates the entire patient form
 */
export function validatePatientForm(formData: PatientFormData): {
  isValid: boolean;
  errors: FormValidationErrors;
} {
  const errors: FormValidationErrors = {};
  const fields: (keyof PatientFormData)[] = [
    'full_name',
    'date_of_birth',
    'email',
    'glucose',
    'haemoglobin',
    'cholesterol',
  ];

  for (const field of fields) {
    const error = validateField(field, formData[field]);
    if (error) {
      errors[field] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
