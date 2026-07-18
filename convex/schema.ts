import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tributes: defineTable({
    name: v.string(),
    message: v.string(),
    storageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  comments: defineTable({
    tributeId: v.id("tributes"),
    author: v.string(),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_tributeId", ["tributeId"]),

  hearts: defineTable({
    tributeId: v.id("tributes"),
    sessionId: v.string(),
  }).index("by_tributeId_and_sessionId", ["tributeId", "sessionId"])
    .index("by_tributeId", ["tributeId"]),
});
