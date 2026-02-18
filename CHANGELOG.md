# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-02-18

### Added
- **Managed Convex Backend Integration**: Fully migrated the data layer from `localStorage` to [Convex](https://www.convex.dev/).
- **Real-Time Synchronisation**: Implemented reactive data fetching using Convex hooks (`useQuery`, `useMutation`), ensuring instant updates across all connected clients.
- **Unified Database Schema**: Created a robust, type-safe schema in `convex/schema.ts` for:
  - `labs`: Detailed lab entries with draft/published status and rrweb recordings.
  - `profile`: Personal bio, skills, certifications, and contact info.
  - `blogPosts`: Content reflections and technical write-ups.
  - `contactMessages`: Persistent storage for visitor inquiries.
- **Cloud-Backed Lab Recorder**: Updated the Recording Station to persist `rrweb` event streams directly to the cloud, bypassing browser storage limits.
- **Improved Data Management**: Added the ability to import/export data and manage cloud documents via the Convex dashboard.
- **AI Narration Persistence**: AI-generated narrations are now saved directly to the database, ensuring they are available globally immediately after generation.

### Changed
- **Admin Panel Refactor**: Replaced legacy `localStorage` logic with real-time Convex mutations for a more responsive management experience.
- **Public Component Updates**: Refactored `HeroSection`, `AboutSection`, `LabsSection`, `BlogSection`, and `ContactSection` to fetch live data.
- **App Entry Point**: Wrapped the application in `ConvexProvider` for global backend access.

### Technical Details
- Backend: Rust-based reactive engine (via Convex cloud).
- Frontend: React + Convex React SDK.
- Coordination: Schema-as-code with TypeScript validation.

---
