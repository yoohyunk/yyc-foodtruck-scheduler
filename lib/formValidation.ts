export interface ValidationError {
  field: string;
  message: string;
  element?: HTMLElement | null;
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  validator?: (value: any) => boolean;
  message?: string;
  element?: HTMLElement | null;
}

// Input sanitization functions
export function sanitizeString(value: string): string {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export function sanitizeEmail(value: string): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

export function sanitizePhone(value: string): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[^\d+\-\(\)\s]/g, '').trim();
}

export function sanitizeNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

export function sanitizeDate(value: any): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export function sanitizePostalCode(value: string): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

export function sanitizeAddress(value: string): string {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-\.\,\#]/g, ''); // Allow common address characters
}

// Enhanced validation functions
export function validateForm(
  formData: Record<string, any>,
  rules: ValidationRule[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  rules.forEach((rule) => {
    const value = formData[rule.field];
    
    // Check if required
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push({
        field: rule.field,
        message: rule.message || `${formatFieldName(rule.field)} is required.`,
        element: rule.element
      });
      return;
    }

    // Run custom validator if provided
    if (rule.validator && value) {
      if (!rule.validator(value)) {
        errors.push({
          field: rule.field,
          message: rule.message || `${formatFieldName(rule.field)} is invalid.`,
          element: rule.element
        });
      }
    }
  });

  return errors;
}

// Utility function to get the actual header height dynamically
function getHeaderHeight(): number {
  if (typeof window === 'undefined') return 80; // Default fallback for SSR
  
  const header = document.querySelector('.header') as HTMLElement;
  if (header) {
    const height = header.offsetHeight;
    // Ensure we have a reasonable height value
    if (height > 0) {
      return height;
    }
  }
  
  // Fallback calculation based on CSS
  // Header has padding: 1rem 2rem (32px top + 32px bottom = 64px)
  // Plus content height (approximately 16px logo + spacing)
  return 80;
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
  if (firstError.element) {
    // Get the actual header height dynamically
    const headerHeight = getHeaderHeight();
    
    // Get the element's position relative to the viewport
    const elementRect = firstError.element.getBoundingClientRect();
    const elementTop = elementRect.top + window.pageYOffset;
    
    // Calculate the target scroll position to center the element in the viewport
    // Subtract header height and add half the viewport height to center it
    const targetScrollPosition = elementTop - headerHeight - (window.innerHeight / 2) + (elementRect.height / 2);
    
    // Scroll to the calculated position
    window.scrollTo({
      top: Math.max(0, targetScrollPosition), // Ensure we don't scroll to negative values
      behavior: "smooth"
    });
    
    // Focus the element after scrolling
    setTimeout(() => {
      firstError.element?.focus();
    }, 500); // Small delay to ensure scroll animation has started
  }
}

// Utility function to format field names for better error messages
export function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .replace(/([A-Z])/g, str => str.toLowerCase()) // Make other capitals lowercase
    .trim();
}

// Utility function to create validation rules with better error messages
export function createValidationRule(
  field: string,
  required: boolean = false,
  validator?: (value: any) => boolean,
  customMessage?: string,
  element?: HTMLElement | null
): ValidationRule {
  const fieldName = formatFieldName(field);
  const message = customMessage || (required ? `${fieldName} is required.` : `${fieldName} is invalid.`);
  
  return {
    field,
    required,
    validator,
    message,
    element
  };
}

// Utility function to get empty field names for error messages
export function getEmptyFieldNames(formData: Record<string, any>, rules: ValidationRule[]): string[] {
  const emptyFields: string[] = [];
  
  rules.forEach((rule) => {
    if (rule.required) {
      const value = formData[rule.field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
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
  const cleanPhone = sanitized.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
}

export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function validateNumber(value: any, min?: number, max?: number): boolean {
  const num = sanitizeNumber(value);
  if (num === null) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
}

export function validateDate(date: Date | null): boolean {
  return date !== null && !isNaN(date.getTime());
}

export function validateTimeRange(startTime: Date | null, endTime: Date | null): boolean {
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
  if (typeof password !== 'string') return false;
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
    createValidationRule("email", true, validateEmail, "Please enter a valid email address.", element),
  
  phone: (element?: HTMLElement | null) => 
    createValidationRule("phone", true, validatePhone, "Please enter a valid phone number.", element),
  
  password: (element?: HTMLElement | null) => 
    createValidationRule("password", true, validatePassword, "Password must be at least 6 characters long.", element),
  
  firstName: (element?: HTMLElement | null) => 
    createValidationRule("firstName", true, validateName, "Please enter a valid first name.", element),
  
  lastName: (element?: HTMLElement | null) => 
    createValidationRule("lastName", true, validateName, "Please enter a valid last name.", element),
  
  required: (field: string, element?: HTMLElement | null) => 
    createValidationRule(field, true, undefined, `${formatFieldName(field)} is required.`, element),
  
  number: (field: string, min?: number, max?: number, element?: HTMLElement | null) => 
    createValidationRule(field, true, (value: any) => validateNumber(value, min, max), 
      `${formatFieldName(field)} must be a valid number${min !== undefined ? ` (minimum: ${min})` : ''}${max !== undefined ? ` (maximum: ${max})` : ''}.`, element),
  
  date: (element?: HTMLElement | null) => 
    createValidationRule("date", true, validateDate, "Please select a valid date.", element),
  
  postalCode: (element?: HTMLElement | null) => 
    createValidationRule("postalCode", false, validatePostalCode, "Please enter a valid postal code (e.g., T2N 1N4).", element),
  
  address: (element?: HTMLElement | null) => 
    createValidationRule("address", true, validateAddress, "Please enter a valid address.", element),
};

// Function to sanitize form data before validation
export function sanitizeFormData(formData: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  Object.keys(formData).forEach(key => {
    const value = formData[key];
    
    switch (key.toLowerCase()) {
      case 'email':
        sanitized[key] = sanitizeEmail(value);
        break;
      case 'phone':
      case 'contactphone':
      case 'user_phone':
        sanitized[key] = sanitizePhone(value);
        break;
      case 'firstname':
      case 'first_name':
        sanitized[key] = sanitizeString(value);
        break;
      case 'lastname':
      case 'last_name':
        sanitized[key] = sanitizeString(value);
        break;
      case 'name':
      case 'title':
        sanitized[key] = sanitizeString(value);
        break;
      case 'address':
      case 'location':
      case 'street':
        sanitized[key] = sanitizeAddress(value);
        break;
      case 'postalcode':
      case 'postal_code':
        sanitized[key] = sanitizePostalCode(value);
        break;
      case 'wage':
      case 'requiredservers':
      case 'required_servers':
      case 'capacity':
        sanitized[key] = sanitizeNumber(value);
        break;
      case 'password':
        sanitized[key] = value; // Don't sanitize password
        break;
      default:
        sanitized[key] = typeof value === 'string' ? sanitizeString(value) : value;
    }
  });
  
  return sanitized;
} 