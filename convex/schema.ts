import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  recommendations: defineTable({
    title: v.string(),
    genre: v.string(),
    link: v.string(),
    blurb: v.string(),
    userId: v.string(),
    isStaffPick: v.boolean(),
  }),
  users: defineTable({
    userId: v.string(),
    role: v.int64(), // e.g., 1 = "admin", 2 = "user", etc
  }),
});