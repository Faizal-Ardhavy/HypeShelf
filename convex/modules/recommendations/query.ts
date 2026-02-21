import { v } from "convex/values";
import { query } from "../../_generated/server";

export const getRecommendations = query({
  args: {
    genre: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let recommendations = ctx.db.query("recommendations");
    
    if (args.genre && args.genre !== "all") {
      recommendations = recommendations.filter((q) => q.eq(q.field("genre"), args.genre));
    }
    
    const results = await recommendations.order("desc").collect();
    return results;
  },
});