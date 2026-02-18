import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    labs: defineTable({
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
        status: v.optional(v.string()), // 'draft' | 'published'
        rrwebRecording: v.optional(v.string()), // JSON string of rrweb events
    }).index("by_status", ["status"]),

    profile: defineTable({
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
    }),

    blogPosts: defineTable({
        title: v.string(),
        content: v.string(),
        date: v.string(),
    }),

    contactMessages: defineTable({
        name: v.string(),
        email: v.string(),
        message: v.string(),
        date: v.string(),
    }),
});
