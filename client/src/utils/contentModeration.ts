import { Filter } from 'bad-words';

// Initialize the profanity filter
const filter = new Filter();

// Add any custom words if needed
// filter.addWords('customword1', 'customword2');

// Remove false positives if needed
// filter.removeWords('word1', 'word2');

/**
 * Check if a string contains profanity
 * @param text - The text to check
 * @returns boolean - True if profanity is detected
 */
export const containsProfanity = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  return filter.isProfane(text.trim());
};

/**
 * Clean profanity from a string
 * @param text - The text to clean
 * @returns string - The cleaned text
 */
export const cleanProfanity = (text: string): string => {
  if (!text || typeof text !== 'string') return text;
  return filter.clean(text);
};

/**
 * Validate form field for profanity
 * @param value - The field value to validate
 * @param fieldName - The name of the field (for error messages)
 * @returns string | null - Error message if profanity found, null if clean
 */
export const validateFieldProfanity = (value: string, fieldName: string = 'This field'): string | null => {
  if (containsProfanity(value)) {
    return `${fieldName} contains inappropriate language. Please use appropriate language.`;
  }
  return null;
};

/**
 * Validate multiple form fields for profanity
 * @param fields - Object with field names as keys and values as values
 * @returns Object with field names as keys and error messages as values (or null if clean)
 */
export const validateFormProfanity = (fields: Record<string, string>): Record<string, string | null> => {
  const errors: Record<string, string | null> = {};
  
  Object.entries(fields).forEach(([fieldName, value]) => {
    if (value && typeof value === 'string') {
      const error = validateFieldProfanity(value, fieldName);
      errors[fieldName] = error;
    } else {
      errors[fieldName] = null;
    }
  });
  
  return errors;
};

export default filter;