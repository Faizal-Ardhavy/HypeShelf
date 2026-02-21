/**
 * TypeScript type definitions for the application
 */

import { Doc } from "./_generated/dataModel";

/**
 * User document type from database
 */
export type User = Doc<"users">;

/**
 * Recommendation document type from database
 */
export type Recommendation = Doc<"recommendations">;

/**
 * Type for Clerk user identity
 */
export interface ClerkUserIdentity {
  tokenIdentifier: string;
  subject: string;
  name?: string;
  email?: string;
}
