

# Portfolio & Lab Documentation Site

## Overview
A modern, bold single-page application (SPA) with PWA support, designed to showcase your VMware/SDDC labs, skills, and professional profile to recruiters and agencies. All data stored locally in the browser (localStorage) with an in-app admin panel to easily add/edit content. Built to be API-ready for future backend integration.

## Design
- **Modern & bold style** — dark-ish base with gradient accents, card-based layouts, smooth animations
- **Responsive** — looks great on desktop (recruiters) and mobile
- **Professional branding** — your name, title ("Cloud & SDDC Infrastructure Engineer"), and a strong hero section

## Sections / Pages (Single Page with smooth scroll navigation)

### 1. Hero / Landing
- Your name, title, tagline
- Quick links to GitHub, LinkedIn, contact
- Call-to-action for recruiters ("View My Labs" / "Download CV")

### 2. About Me + Skills
- Short professional bio highlighting CCNA, AWS re/Start, cloud/infra experience, and SDDC ambitions
- Visual skills matrix (icons/progress bars for VMware, networking, cloud, automation, etc.)
- Certifications section with badges

### 3. Labs Portfolio (Main Feature)
- Card grid of all your lab projects
- Each lab card shows: title, tags (vSphere, vSAN, NSX, etc.), short description, thumbnail/diagram
- Click to expand into a detailed view with:
  - Objective / problem statement
  - Environment details
  - Step-by-step documentation with screenshots
  - Outcome / lessons learned
  - Links to automation scripts / GitHub repos
- Filterable by technology tags

### 4. GitHub Integration
- Embedded GitHub contribution heatmap (fetched from GitHub public API)
- Pinned/recent repo cards showing repo name, description, language, stars
- Links directly to your GitHub profile and repos

### 5. Blog / Reflections
- Simple blog-style entries for lessons learned, career reflections, lab write-ups
- Each post has title, date, content (supports markdown-style formatting)
- Managed via the admin panel

### 6. CV / Resume
- Downloadable PDF button
- Optional inline preview of key CV highlights

### 7. Contact
- Simple contact form (name, email, message)
- For now stores submissions in localStorage (ready for future email API integration)
- Links to LinkedIn, GitHub, email

## Admin Panel (/admin)
- Hidden admin page accessible via URL
- Forms to:
  - Add/edit/delete lab entries (title, description, tags, steps, screenshots, links)
  - Add/edit/delete blog posts
  - Update bio, skills, certifications
  - Upload CV PDF
- All data persisted in localStorage
- Export/import data as JSON (backup and portability)
- Structured so swapping localStorage for an API later is straightforward

## Technical Approach
- PWA-enabled (installable, works offline)
- All data managed via a local data layer (localStorage) with a clean service abstraction — easy to swap for API calls later
- GitHub API integration for public profile data (repos, contributions) — no auth needed for public profiles
- Responsive, animated, modern UI with Tailwind CSS and shadcn components

