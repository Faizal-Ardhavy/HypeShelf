import { v } from "convex/values";
import { mutation } from "../../_generated/server";

export const addRecommendation = mutation({
  args: {
    title: v.string(),
    genre: v.string(),
    link: v.string(),
    blurb: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!userRecord) throw new Error("User not found. Please sign in again.");

    await ctx.db.insert("recommendations", {
        ...args,
        userId: identity.subject,
        authorName: userRecord.name,
        isStaffPick: false,
    });
  },
});

export const deleteRecommendation = mutation({
    args: {
        id: v.id("recommendations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const userRecord = await ctx.db
          .query("users")
          .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
          .first();

        if (!userRecord) throw new Error("User not found");

        const recommendation = await ctx.db.get(args.id);
        if (!recommendation) throw new Error("Recommendation not found");

        if (userRecord.role !== "admin" && recommendation.userId !== identity.subject) {
            throw new Error("Not authorized to delete this recommendation");
        }

        await ctx.db.delete(args.id);
    },
});

export const toggleStaffPick = mutation({
    args: {
        id: v.id("recommendations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const userRecord = await ctx.db
          .query("users")
          .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
          .first();

        if (!userRecord || userRecord.role !== "admin") {
            throw new Error("Only admins can mark staff picks");
        }

        const recommendation = await ctx.db.get(args.id);
        if (!recommendation) throw new Error("Recommendation not found");

        await ctx.db.patch(args.id, {
            isStaffPick: !recommendation.isStaffPick,
        });
    },
});