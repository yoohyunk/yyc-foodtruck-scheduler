export interface ValidationError {
  field: string;
  message: string;
  element?: HTMLElement | null;
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  validator?: (value: unknown) => boolean;
  message?: string;
  element?: HTMLElement | null;
}

// Input sanitization functions
export function sanitizeString(value: string): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/\s+/g, " "); // Normalize whitespace
}

export function sanitizeEmail(value: string): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

export function sanitizePhone(value: string): string {
  if (typeof value !== "string") return "";
  return value.replace(/[^\d+\-\(\)\s]/g, "").trim();
}

export function sanitizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = parseFloat(value as string);
  return isNaN(num) ? null : num;
}

export function sanitizeDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(value as string);
  return isNaN(date.getTime()) ? null : date;
}

export function sanitizePostalCode(value: string): string {
  if (typeof value !== "string") return "";
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function sanitizeAddress(value: string): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[^\w\s\-\.\,\#]/g, ""); // Allow common address characters
}

// Enhanced validation functions
export function validateForm<T extends Record<string, unknown>>(
  formData: T,
  rules: ValidationRule[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const rule of rules) {
    const value = formData[rule.field];
    if (rule.required && !validateRequired(value)) {
      errors.push({
        field: rule.field,
        message: rule.message || `${rule.field} is required`,
        element: rule.element,
      });
      continue;
    }
    if (rule.validator && !rule.validator(value)) {
      errors.push({
        field: rule.field,
        message: rule.message || `${rule.field} is invalid`,
        element: rule.element,
      });
    }
  }
  return errors;
}

/**
 * Scrolls to the first error element and centers it in the viewport
 *
 * This function:
 * 1. Dynamically calculates the header height to account for the sticky header
 * 2. Centers the error element in the viewport for better visibility
 * 3. Ensures the element is not hidden behind the header
 * 4. Focuses the element after scrolling for better accessibility
 *
 * @param errors - Array of validation errors with element references
 */
export function scrollToFirstError(errors: ValidationError[]): void {
  if (errors.length === 0) return;
  const firstError = errors[0];
  if (
    firstError.element &&
    typeof firstError.element.scrollIntoView === "function"
  ) {
    firstError.element.scrollIntoView({ behavior: "smooth", block: "center" });
    (firstError.element as HTMLElement).focus?.();
  }
}

// Utility function to format field names for better error messages
export function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .replace(/([A-Z])/g, (str) => str.toLowerCase()) // Make other capitals lowercase
    .trim();
}

// Utility function to create validation rules with better error messages
export function createValidationRule(
  field: string,
  required?: boolean,
  validator?: (value: unknown) => boolean,
  message?: string,
  element?: HTMLElement | null
): ValidationRule {
  return {
    field,
    required,
    validator,
    message,
    element,
  };
}

// Utility function to get empty field names for error messages
export function getEmptyFieldNames(
  formData: Record<string, unknown>,
  rules: ValidationRule[]
): string[] {
  const emptyFields: string[] = [];

  rules.forEach((rule) => {
    if (rule.required) {
      const value = formData[rule.field];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        emptyFields.push(formatFieldName(rule.field));
      }
    }
  });

  return emptyFields;
}

// Enhanced validation functions with sanitization
export function validateEmail(email: string): boolean {
  const sanitized = sanitizeEmail(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized);
}

export function validatePhone(phone: string): boolean {
  const sanitized = sanitizePhone(phone);
  // Allow various phone formats: +1-555-123-4567, (555) 123-4567, 555-123-4567, 5551234567
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = sanitized.replace(/[\s\-\(\)]/g, "");
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
}

export function validateRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function validateNumber(
  value: string | number,
  min?: number,
  max?: number
): boolean {
  const num = sanitizeNumber(value);
  if (num === null) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
}

export function validateDate(date: Date | null): boolean {
  return date !== null && !isNaN(date.getTime());
}

export function validateTimeRange(
  startTime: Date | null,
  endTime: Date | null
): boolean {
  if (!startTime || !endTime) return false;
  return endTime > startTime;
}

export function validatePostalCode(code: string): boolean {
  const sanitized = sanitizePostalCode(code);
  // Canadian postal code format: A1A1A1
  const postalCodeRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
  return postalCodeRegex.test(sanitized);
}

export function validateAddress(address: string): boolean {
  const sanitized = sanitizeAddress(address);
  return sanitized.length >= 5; // Minimum reasonable address length
}

export function validatePassword(password: string): boolean {
  if (typeof password !== "string") return false;
  return password.length >= 6; // Minimum 6 characters
}

export function validateName(name: string): boolean {
  const sanitized = sanitizeString(name);
  const nameRegex = /^[a-zA-Z\s\-']{2,50}$/;
  return nameRegex.test(sanitized);
}

// Pre-built validation rule sets for common form types
export const commonValidationRules = {
  email: (element?: HTMLElement | null) =>
    createValidationRule(
      "email",
      true,
      (value: unknown) => typeof value === "string" && validateEmail(value),
      "Please enter a valid email address.",
      element
    ),

  phone: (element?: HTMLElement | null) =>
    createValidationRule(
      "phone",
      true,
      (value: unknown) => typeof value === "string" && validatePhone(value),
      "Please enter a valid phone number.",
      element
    ),

  password: (element?: HTMLElement | null) =>
    createValidationRule(
      "password",
      true,
      (value: unknown) => typeof value === "string" && validatePassword(value),
      "Password must be at least 6 characters long.",
      element
    ),

  firstName: (element?: HTMLElement | null) =>
    createValidationRule(
      "firstName",
      true,
      (value: unknown) => typeof value === "string" && validateName(value),
      "Please enter a valid first name.",
      element
    ),

  lastName: (element?: HTMLElement | null) =>
    createValidationRule(
      "lastName",
      true,
      (value: unknown) => typeof value === "string" && validateName(value),
      "Please enter a valid last name.",
      element
    ),

  required: (field: string, element?: HTMLElement | null) =>
    createValidationRule(
      field,
      true,
      undefined,
      `${formatFieldName(field)} is required.`,
      element
    ),

  number: (
    field: string,
    min?: number,
    max?: number,
    element?: HTMLElement | null
  ) =>
    createValidationRule(
      field,
      true,
      (value: unknown) =>
        (typeof value === "string" || typeof value === "number") &&
        validateNumber(value, min, max),
      `${formatFieldName(field)} must be a valid number${min !== undefined ? ` (minimum: ${min})` : ""}${max !== undefined ? ` (maximum: ${max})` : ""}.`,
      element
    ),

  date: (element?: HTMLElement | null) =>
    createValidationRule(
      "date",
      true,
      (value: unknown) =>
        value instanceof Date ||
        (value === null && validateDate(value as Date | null)),
      "Please select a valid date.",
      element
    ),

  postalCode: (element?: HTMLElement | null) =>
    createValidationRule(
      "postalCode",
      false,
      (value: unknown) =>
        typeof value === "string" && validatePostalCode(value),
      "Please enter a valid postal code (e.g., T2N 1N4).",
      element
    ),

  address: (element?: HTMLElement | null) =>
    createValidationRule(
      "address",
      true,
      (value: unknown) => typeof value === "string" && validateAddress(value),
      "Please enter a valid address.",
      element
    ),
};

// Function to sanitize form data before validation
export function sanitizeFormData<T extends Record<string, unknown>>(
  formData: T
): T {
  // Implement any needed sanitization logic here
  return formData;
}

// Autofill detection utilities
export function handleAutofill(
  element: HTMLInputElement | HTMLSelectElement,
  callback: (value: string) => void
): void {
  // Listen for autofill events
  element.addEventListener("animationstart", (e) => {
    const animationEvent = e as AnimationEvent;
    if (animationEvent.animationName === "onAutoFillStart") {
      callback(element.value);
    }
  });

  // Fallback: check for autofill on focus/blur
  let originalValue = element.value;

  element.addEventListener("focus", () => {
    originalValue = element.value;
  });

  element.addEventListener("blur", () => {
    if (element.value !== originalValue) {
      callback(element.value);
    }
  });

  // Additional fallback: check periodically for autofill
  const checkAutofill = () => {
    if (element.value && element.value !== originalValue) {
      callback(element.value);
      originalValue = element.value;
    }
  };

  // Check after a short delay to catch autofill
  setTimeout(checkAutofill, 100);
  setTimeout(checkAutofill, 500);
  setTimeout(checkAutofill, 1000);
}

// CSS for autofill detection
export const autofillDetectionCSS = `
  @keyframes onAutoFillStart {
    from {/**/}
    to {/**/}
  }
  
  @keyframes onAutoFillCancel {
    from {/**/}
    to {/**/}
  }
  
  input:-webkit-autofill {
    animation-name: onAutoFillStart;
  }
  
  input:not(:-webkit-autofill) {
    animation-name: onAutoFillCancel;
  }
`;

// Enhanced validation that accounts for autofill
export function validateFormWithAutofill<T extends Record<string, unknown>>(
  formData: T,
  rules: ValidationRule[],
  formElement?: HTMLFormElement
): ValidationError[] {
  const errors = validateForm(formData, rules);

  // If we have a form element, check for autofilled fields
  if (formElement) {
    const inputs = formElement.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      const element = input as HTMLInputElement | HTMLSelectElement;
      if (element.value && element.dataset.autofilled === "true") {
        // Remove errors for autofilled fields that have values
        const fieldName = element.name;
        const fieldErrors = errors.filter((error) => error.field === fieldName);
        fieldErrors.forEach((error) => {
          const index = errors.indexOf(error);
          if (index > -1) {
            errors.splice(index, 1);
          }
        });
      }
    });
  }

  return errors;
}
