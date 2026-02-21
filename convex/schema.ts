import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  recommendations: defineTable({
    title: v.string(),
    genre: v.string(),
    link: v.string(),
    blurb: v.string(),
    userId: v.string(),
    authorName: v.string(),
    isStaffPick: v.boolean(),
  }),
  users: defineTable({
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.string(),
  }).index("by_userId", ["userId"]),
});