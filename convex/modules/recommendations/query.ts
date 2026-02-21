import { query } from "../../_generated/server";

export const getRecommendations = query({
  handler: async (ctx) => {
    return await ctx.db.query("recommendations").collect();
  },
});