/**
 * Application-wide constants
 */

/**
 * User roles define access levels in the application
 * - ADMIN: First user, can manage all recommendations and toggle staff picks
 * - USER: Regular users, can only manage their own recommendations
 */
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

/**
 * Genre options for recommendations
 */
export const GENRES = [
  "Movies & TV",
  "Music",
  "Books",
  "Games",
  "Tech",
  "Food & Drinks",
  "Travel",
  "Other",
] as const;

/**
 * Validation constraints
 */
export const VALIDATION = {
  TITLE_MAX_LENGTH: 200,
  TITLE_MIN_LENGTH: 1,
  BLURB_MAX_LENGTH: 500,
  BLURB_MIN_LENGTH: 1,
  LINK_MAX_LENGTH: 2048,
} as const;

/**
 * Error messages with consistent formatting
 */
export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "Authentication required",
  INVALID_TITLE: `Title must be between ${VALIDATION.TITLE_MIN_LENGTH} and ${VALIDATION.TITLE_MAX_LENGTH} characters`,
  INVALID_BLURB: `Description must be between ${VALIDATION.BLURB_MIN_LENGTH} and ${VALIDATION.BLURB_MAX_LENGTH} characters`,
  INVALID_LINK: `URL must be a valid link (max ${VALIDATION.LINK_MAX_LENGTH} characters)`,
  PERMISSION_DENIED: "You don't have permission to perform this action",
  NOT_FOUND: "Resource not found",
  INVALID_GENRE: "Invalid genre selected",
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  RECOMMENDATION_ADDED: "Recommendation added successfully!",
  RECOMMENDATION_DELETED: "Recommendation deleted successfully!",
  STAFF_PICK_TOGGLED: "Staff pick status updated!",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
export type Genre = (typeof GENRES)[number];
