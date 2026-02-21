import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { ROLES, VALIDATION, ERROR_MESSAGES, GENRES } from "../../constants";

/**
 * Helper function to sanitize user input
 * Prevents XSS by trimming and removing dangerous characters
 */
function sanitizeInput(input: string): string {
  return input.trim().replace(/<script[^>]*>.*?<\/script>/gi, "").substring(0, 2048);
}

/**
 * Helper function to validate URL format
 */
function isValidUrl(url: string): boolean {
  if (!url || url.length > VALIDATION.LINK_MAX_LENGTH) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Add a new recommendation
 * 
 * Authorization: Requires authenticated user
 * Validation: 
 * - Title: 1-200 characters
 * - Blurb: 1-500 characters  
 * - Link: Valid HTTP/HTTPS URL, max 2048 characters
 * - Genre: Must be from predefined list
 */
export const addRecommendation = mutation({
  args: {
    title: v.string(),
    genre: v.string(),
    link: v.string(),
    blurb: v.string(),
  },
  handler: async (ctx, args) => {
    // Auth check: User must be signed in
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    // Sanitize inputs to prevent XSS
    const sanitizedTitle = sanitizeInput(args.title);
    const sanitizedBlurb = sanitizeInput(args.blurb);
    const sanitizedLink = sanitizeInput(args.link);

    // Validate title length
    if (
      sanitizedTitle.length < VALIDATION.TITLE_MIN_LENGTH ||
      sanitizedTitle.length > VALIDATION.TITLE_MAX_LENGTH
    ) {
      throw new Error(ERROR_MESSAGES.INVALID_TITLE);
    }

    // Validate blurb length
    if (
      sanitizedBlurb.length > VALIDATION.BLURB_MAX_LENGTH
    ) {
      throw new Error(ERROR_MESSAGES.INVALID_BLURB);
    }

    // Validate link format
    if (sanitizedLink && !isValidUrl(sanitizedLink)) {
      throw new Error(ERROR_MESSAGES.INVALID_LINK);
    }

    // Validate genre
    if (!GENRES.includes(args.genre as typeof GENRES[number])) {
      throw new Error(ERROR_MESSAGES.INVALID_GENRE);
    }

    // Get user record to attach author name
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!userRecord) {
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    // Insert recommendation with sanitized data
    await ctx.db.insert("recommendations", {
      title: sanitizedTitle,
      genre: args.genre,
      link: sanitizedLink,
      blurb: sanitizedBlurb,
      userId: identity.subject,
      authorName: userRecord.name,
      isStaffPick: false,
    });
  },
});

/**
 * Delete a recommendation
 * 
 * Authorization (RBAC):
 * - ADMIN role: Can delete any recommendation
 * - USER role: Can only delete their own recommendations
 * 
 * This implements Role-Based Access Control where:
 * 1. First user becomes admin (see users/mutation.ts)
 * 2. Admins have elevated permissions
 * 3. Regular users can only manage their own content
 */
export const deleteRecommendation = mutation({
  args: {
    id: v.id("recommendations"),
  },
  handler: async (ctx, args) => {
    // Auth check: User must be signed in
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    // Get user's role from database
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!userRecord) {
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    // Get recommendation to delete
    const recommendation = await ctx.db.get(args.id);
    if (!recommendation) {
      throw new Error(ERROR_MESSAGES.NOT_FOUND);
    }

    // RBAC: Check if user has permission to delete
    // Admins can delete anything, users can only delete their own
    const isAdmin = userRecord.role === ROLES.ADMIN;
    const isOwner = recommendation.userId === identity.subject;

    if (!isAdmin && !isOwner) {
      throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
    }

    // Delete the recommendation
    await ctx.db.delete(args.id);
  },
});

/**
 * Toggle staff pick status on a recommendation
 * 
 * Authorization (RBAC):
 * - ADMIN role only: This is an admin-exclusive feature
 * - Regular users cannot mark staff picks
 * 
 * Staff picks are curated recommendations highlighted by admins
 * to showcase quality content to all users
 */
export const toggleStaffPick = mutation({
  args: {
    id: v.id("recommendations"),
  },
  handler: async (ctx, args) => {
    // Auth check: User must be signed in
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    // Get user's role from database
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    // RBAC: Only admins can toggle staff picks
    if (!userRecord || userRecord.role !== ROLES.ADMIN) {
      throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
    }

    // Get recommendation to toggle
    const recommendation = await ctx.db.get(args.id);
    if (!recommendation) {
      throw new Error(ERROR_MESSAGES.NOT_FOUND);
    }

    // Toggle the staff pick status
    await ctx.db.patch(args.id, {
      isStaffPick: !recommendation.isStaffPick,
    });
  },
});