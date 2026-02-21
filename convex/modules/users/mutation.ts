import { mutation } from "../../_generated/server";
import { ROLES, ERROR_MESSAGES } from "../../constants";


export const createOrGetUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Verify user is authenticated via Clerk
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    // Check if user already exists in our database
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    // Return existing user if found
    if (existingUser) {
      return existingUser;
    }

    // RBAC: Determine if this is the first user (becomes admin)
    const totalUsers = await ctx.db.query("users").collect();
    const isFirstUser = totalUsers.length === 0;

    // Create new user with appropriate role
    const newUser = await ctx.db.insert("users", {
      userId: identity.subject,
      name: identity.name || identity.email || "Anonymous",
      email: identity.email || "",
      role: isFirstUser ? ROLES.ADMIN : ROLES.USER, // First user = admin
    });

    return await ctx.db.get(newUser);
  },
});
