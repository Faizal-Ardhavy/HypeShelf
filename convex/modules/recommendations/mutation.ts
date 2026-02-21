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
    // const user = await ctx.auth.getUserIdentity();
    // if (!user) throw new Error("Not authenticated");

    await ctx.db.insert("recommendations", {
        ...args,
        userId: "default-user-id",
        isStaffPick: false,
    });
  },
});