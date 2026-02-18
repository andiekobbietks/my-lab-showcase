# Application Workflows Documentation

This document provides a comprehensive overview of the **My Lab Showcase** portfolio application, its architecture, and its core user workflows.

## 🚀 Project Overview
**My Lab Showcase** is a modern, responsive portfolio application built with:
- **Framework**: React with TypeScript and Vite.
- **Styling**: Tailwind CSS and shadcn/ui.
- **Data Layer**: A local-first architecture using `localStorage`, making it lightweight and easy to migrate to a backend (like Supabase) in the future.
- **Special Features**: Integrated AI Narration engine for lab video/media analysis.

---

## 🛠️ Core Workflows

### 1. Public Portfolio Experience
The homepage is designed to show your professional identity and hands-on laboratory work.

![Homepage Screenshot](file:///c:/Users/LLM-Test/MyLabsPortfolioSite/my-lab-showcase/homepage.png)

| Component | Workflow / Purpose |
| :--- | :--- |
| **Hero Section** | Initial impression; shows your title and primary tagline. |
| **About Section** | Personal bio and professional background. |
| **Labs Showcase** | The centerpiece; displays laboratory experiments with tags, objectives, and interactive media. |
| **GitHub Integration** | Visualises your contributions and repository links. |
| **Blog Feed** | Shares professional insights and project updates. |
| **CV / Resume** | One-click access to your professional CV. |
| **Contact Form** | Allows visitors to send messages directly to your local storage. |

### 2. Admin Management Panel
Accessed via `/admin`, this panel allows for complete customization of the portfolio without editing code.

![Admin Screenshot](file:///c:/Users/LLM-Test/MyLabsPortfolioSite/my-lab-showcase/admin.png)

#### **Profile Management**
- **Flow**: Update Name, Title, Bio, and Social links.
- **Skills & Certs**: Dynamically add or remove technical skills (with proficiency levels) and certifications.
- **Save**: Direct persistence to browser storage with instant feedback via toast notifications.

#### **Lab CRUD (Create, Read, Update, Delete)**
- **Workflow**: 
  1. Click "+ Add Lab" to enter the Lab Creator.
  2. Define the Objective, Environment, and specific Steps.
  3. Attach Media (Videos/GIFs/Images) by providing URLs.
  4. Save to see it instantly reflected on the homepage.

#### **Blog Post Management**
- **Flow**: Simple interface for title-and-text blog entries.

### 3. AI Narration Engine Workflow
This is a unique feature that adds "automatic documentation" to your lab media.

1. **Trigger**: Clicking "Generate Narration" within a Lab edit form.
2. **Analysis**: The application attempts to use **Foundry (On-Device AI)** or falls back to Cloud/Text-based engines.
3. **Output**: Automatically generates a technical description/narration for attached videos or screenshots.
4. **Persistence**: The AI-generated text is saved alongside the lab metadata.

### 4. Data Portability (Export/Import)
Ensures your data is never "locked in" to a single browser.

- **Export**: Downloads a `portfolio-data.json` file containing everything (Profile, Labs, Blog, Contacts).
- **Import**: Allows you to upload a previously exported JSON to restore your portfolio state on a different machine or browser.

---

## 🧪 Technical Verification
- **Unit Tests**: Pass (`src/test/example.test.ts`).
- **Routing**: Verified using `react-router-dom` (`App.tsx`).
- **Persistence**: Verified via `lib/data.ts` using the `localStorage` API.

> [!NOTE]
> This application is built for high data independence, allowing researchers and engineers to document their work locally before publishing.
