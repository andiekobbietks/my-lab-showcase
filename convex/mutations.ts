import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const updateProfile = mutation({
    args: {
        id: v.optional(v.id("profile")),
        name: v.string(),
        title: v.string(),
        tagline: v.string(),
        bio: v.string(),
        githubUsername: v.string(),
        linkedinUrl: v.string(),
        email: v.string(),
        skills: v.array(v.object({
            name: v.string(),
            level: v.float64(),
            category: v.string(),
        })),
        certifications: v.array(v.object({
            name: v.string(),
            issuer: v.string(),
            year: v.string(),
        })),
        cvUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...data } = args;
        if (id) {
            await ctx.db.patch(id, data);
            return id;
        } else {
            const existing = await ctx.db.query("profile").first();
            if (existing) {
                await ctx.db.patch(existing._id, data);
                return existing._id;
            }
            return await ctx.db.insert("profile", data);
        }
    },
});

export const saveLab = mutation({
    args: {
        id: v.optional(v.id("labs")),
        title: v.string(),
        description: v.string(),
        tags: v.array(v.string()),
        objective: v.string(),
        environment: v.string(),
        steps: v.array(v.string()),
        outcome: v.string(),
        repoUrl: v.optional(v.string()),
        thumbnail: v.optional(v.string()),
        media: v.optional(v.array(v.object({
            url: v.string(),
            type: v.string(),
            caption: v.optional(v.string()),
            narration: v.optional(v.string()),
            narrationConfidence: v.optional(v.string()),
            narrationSource: v.optional(v.string()),
        }))),
        aiNarration: v.optional(v.string()),
        narrationSource: v.optional(v.string()),
        status: v.optional(v.string()),
        rrwebRecording: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...data } = args;
        if (id) {
            await ctx.db.patch(id, data);
            return id;
        }
        return await ctx.db.insert("labs", data);
    },
});

export const deleteLab = mutation({
    args: { id: v.id("labs") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const saveBlogPost = mutation({
    args: {
        id: v.optional(v.id("blogPosts")),
        title: v.string(),
        content: v.string(),
        date: v.string(),
    },
    handler: async (ctx, args) => {
        const { id, ...data } = args;
        if (id) {
            await ctx.db.patch(id, data);
            return id;
        }
        return await ctx.db.insert("blogPosts", data);
    },
});

export const deleteBlogPost = mutation({
    args: { id: v.id("blogPosts") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
