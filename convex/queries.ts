import { query } from "./_generated/server";
import { v } from "convex/values";

export const getProfile = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("profile").first();
    },
});

export const getLabs = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (args.status) {
            return await ctx.db
                .query("labs")
                .withIndex("by_status", (q) => q.eq("status", args.status))
                .collect();
        }
        return await ctx.db.query("labs").collect();
    },
});

export const getLabById = query({
    args: { id: v.id("labs") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getBlogPosts = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("blogPosts").collect();
    },
});

export const getTheme = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("theme").first();
    },
});
