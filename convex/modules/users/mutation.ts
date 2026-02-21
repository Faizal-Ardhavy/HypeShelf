import { mutation } from "../../_generated/server";

export const createOrGetUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (existingUser) {
      return existingUser;
    }

    const totalUsers = await ctx.db.query("users").collect();
    const isFirstUser = totalUsers.length === 0;

    const newUser = await ctx.db.insert("users", {
      userId: identity.subject,
      name: identity.name || identity.email || "Anonymous",
      email: identity.email || "",
      role: isFirstUser ? "admin" : "user",
    });

    return await ctx.db.get(newUser);
  },
});
