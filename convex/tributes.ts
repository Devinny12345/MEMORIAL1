import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Queries ────────────────────────────────────────────────────────────────

/** Return all tributes, newest first, with their comments, heart counts, and photo URLs. */
export const getTributes = query({
  args: {},
  handler: async (ctx) => {
    const tributes = await ctx.db
      .query("tributes")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    return Promise.all(
      tributes.map(async (t) => {
        // Fetch comments for this tribute
        const comments = await ctx.db
          .query("comments")
          .withIndex("by_tributeId", (q) => q.eq("tributeId", t._id))
          .collect();

        // Fetch hearts for this tribute
        const hearts = await ctx.db
          .query("hearts")
          .withIndex("by_tributeId", (q) => q.eq("tributeId", t._id))
          .collect();

        // Resolve photo URL if storageId exists
        let photoUrl;
        if (t.storageId) {
          try {
            photoUrl = await ctx.storage.getUrl(t.storageId);
          } catch (e) {
            console.error("Failed to resolve storage URL:", e);
          }
        }

        return {
          id: t._id,
          name: t.name,
          message: t.message,
          createdAt: new Date(t.createdAt).toISOString(),
          photoUrl: photoUrl || t.photoUrl || undefined,
          comments: comments.map((c) => ({
            id: c._id,
            author: c.author,
            text: c.text,
            createdAt: new Date(c.createdAt).toISOString(),
          })).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), // Newest comments first
          hearts: hearts.map((h) => h.sessionId),
        };
      })
    );
  },
});

/** Seed default starter tributes if they do not exist */
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if moments-1.jpg exists
    const existing1 = await ctx.db
      .query("tributes")
      .filter((q) => q.eq(q.field("photoUrl"), "/moments-1.jpg"))
      .first();

    if (!existing1) {
      await ctx.db.insert("tributes", {
        name: "Family",
        message: "Forever loved",
        photoUrl: "/moments-1.jpg",
        createdAt: Date.now() - 100000,
      });
    }

    // Check if Main.jpg exists
    const existing2 = await ctx.db
      .query("tributes")
      .filter((q) => q.eq(q.field("photoUrl"), "/Main.jpg"))
      .first();

    if (!existing2) {
      await ctx.db.insert("tributes", {
        name: "Family",
        message: "Beautiful memories",
        photoUrl: "/Main.jpg",
        createdAt: Date.now() - 50000,
      });
    }
  },
});

// ── Mutations ──────────────────────────────────────────────────────────────

/** Generate a short-lived upload URL for Convex file storage. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/** Save a new tribute record. storageId is optional (photo may not be included). */
export const addTribute = mutation({
  args: {
    name: v.string(),
    message: v.string(),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { name, message, storageId }) => {
    const id = await ctx.db.insert("tributes", {
      name,
      message,
      storageId,
      createdAt: Date.now(),
    });

    const photoUrl = storageId
      ? await ctx.storage.getUrl(storageId)
      : undefined;

    return {
      id,
      name,
      message,
      createdAt: new Date().toISOString(),
      photoUrl,
    };
  },
});

/** Add a comment to a tribute */
export const addComment = mutation({
  args: {
    tributeId: v.id("tributes"),
    author: v.string(),
    text: v.string(),
  },
  handler: async (ctx, { tributeId, author, text }) => {
    const commentId = await ctx.db.insert("comments", {
      tributeId,
      author,
      text,
      createdAt: Date.now(),
    });
    return commentId;
  },
});

/** Toggle a heart on a tribute for a specific session ID */
export const toggleHeart = mutation({
  args: {
    tributeId: v.id("tributes"),
    sessionId: v.string(),
  },
  handler: async (ctx, { tributeId, sessionId }) => {
    const existing = await ctx.db
      .query("hearts")
      .withIndex("by_tributeId_and_sessionId", (q) =>
        q.eq("tributeId", tributeId).eq("sessionId", sessionId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { hearted: false };
    } else {
      await ctx.db.insert("hearts", {
        tributeId,
        sessionId,
      });
      return { hearted: true };
    }
  },
});

// ── Admin Functions ────────────────────────────────────────────────────────

/** Delete a tribute and all its associated comments and hearts. Requires correct password. */
export const adminDeleteTribute = mutation({
  args: {
    tributeId: v.id("tributes"),
    password: v.string(),
  },
  handler: async (ctx, { tributeId, password }) => {
    const expectedPassword = process.env.ADMIN_PASSWORD || "Mich777";
    if (password !== expectedPassword) {
      throw new Error("Invalid admin password");
    }

    // Retrieve the tribute to check if it has a file to delete
    const tribute = await ctx.db.get(tributeId);
    if (!tribute) {
      throw new Error("Tribute not found");
    }

    // Delete stored photo if it exists
    if (tribute.storageId) {
      try {
        await ctx.storage.delete(tribute.storageId);
      } catch (e) {
        console.error("Failed to delete photo from storage:", e);
      }
    }

    // Delete comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_tributeId", (q) => q.eq("tributeId", tributeId))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete hearts
    const hearts = await ctx.db
      .query("hearts")
      .withIndex("by_tributeId", (q) => q.eq("tributeId", tributeId))
      .collect();
    for (const heart of hearts) {
      await ctx.db.delete(heart._id);
    }

    // Delete the tribute itself
    await ctx.db.delete(tributeId);
    return { success: true };
  },
});

/** Delete a comment. Requires correct password. */
export const adminDeleteComment = mutation({
  args: {
    commentId: v.id("comments"),
    password: v.string(),
  },
  handler: async (ctx, { commentId, password }) => {
    const expectedPassword = process.env.ADMIN_PASSWORD || "Mich777";
    if (password !== expectedPassword) {
      throw new Error("Invalid admin password");
    }

    const comment = await ctx.db.get(commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    await ctx.db.delete(commentId);
    return { success: true };
  },
});

/** Remove only the photo from a tribute, leaving the text message. Requires correct password. */
export const adminRemovePhoto = mutation({
  args: {
    tributeId: v.id("tributes"),
    password: v.string(),
  },
  handler: async (ctx, { tributeId, password }) => {
    const expectedPassword = process.env.ADMIN_PASSWORD || "Mich777";
    if (password !== expectedPassword) {
      throw new Error("Invalid admin password");
    }

    const tribute = await ctx.db.get(tributeId);
    if (!tribute) {
      throw new Error("Tribute not found");
    }

    if (tribute.storageId) {
      try {
        await ctx.storage.delete(tribute.storageId);
      } catch (e) {
        console.error("Failed to delete photo from storage:", e);
      }
      await ctx.db.patch(tributeId, {
        storageId: undefined,
      });
    }

    return { success: true };
  },
});

