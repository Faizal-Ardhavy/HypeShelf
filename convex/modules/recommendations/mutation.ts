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
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    await ctx.db.insert("recommendations", {
        ...args,
        userId: user.subject,
        isStaffPick: false,
    });
  },
});

export const deleteRecommendation = mutation({
    args: {
        id: v.id("recommendations"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new Error("Not authenticated");

        const recommendation = await ctx.db.get(args.id);
        if (!recommendation) throw new Error("Recommendation not found");
        if (recommendation.userId !== user.subject) {
            throw new Error("Not authorized to delete this recommendation");
        }

        await ctx.db.delete(args.id);
    },
});