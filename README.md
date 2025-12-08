# 10xCards

A web application for rapid generation and management of educational flashcards, leveraging AI and manual workflows to streamline spaced-repetition learning.

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Getting Started Locally](#getting-started-locally)
3. [Available Scripts](#available-scripts)
4. [Deployment](#deployment)
5. [Project Scope](#project-scope)
6. [Project Status](#project-status)
7. [License](#license)

## Tech Stack

- **Frontend:** Astro 5, React 19, TypeScript 5, Tailwind CSS 4, Shadcn/ui
- **Backend / Database:** Supabase Auth & Postgres (serverless, row-level security)
- **AI Integration:** Openrouter.ai (LLM API)
- **Testing:**
  - **Unit Tests:** Vitest, @testing-library/react, @testing-library/user-event
  - **E2E Tests:** Playwright
- **CI/CD & Hosting:** GitHub Actions + Cloudflare Pages
- **Runtime:** Node.js 22.14.0 (see `.nvmrc`)
- **Adapter:** @astrojs/cloudflare (SSR support)

## Getting Started Locally

### Prerequisites

- Node.js v22.14.0 (use `nvm use` to switch)
- npm ≥ 8
- Supabase project (Auth & Database)
- Openrouter.ai API key

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/10xCards.git
   cd 10xCards
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**  
   Create a `.env` file at the project root with the following entries:

   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   OPENROUTER_API_URL=https://openrouter.ai/api/v1  # Optional, defaults to this value
   SITE_URL=http://localhost:3000  # Optional, for development
   ```

4. **Run in development mode**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Available Scripts

### Development

- `npm run dev` — Start the Astro development server
- `npm run dev:e2e` — Start the Astro development server in test mode
- `npm run build` — Build the production site
- `npm run preview` — Preview the production build
- `npm run astro` — Run the Astro CLI

### Code Quality

- `npm run lint` — Run ESLint on all source files
- `npm run lint:fix` — Auto-fix linting issues
- `npm run format` — Format all files with Prettier

### Testing

- `npm run test` — Run unit tests with Vitest
- `npm run test:watch` — Run unit tests in watch mode
- `npm run test:ui` — Run unit tests with Vitest UI
- `npm run test:coverage` — Run unit tests with coverage report
- `npm run test:e2e` — Run end-to-end tests with Playwright
- `npm run test:e2e:ui` — Run E2E tests with Playwright UI
- `npm run test:e2e:debug` — Run E2E tests in debug mode
- `npm run test:e2e:report` — Show Playwright test report

## Deployment

The application is configured for deployment to **Cloudflare Pages** with automated CI/CD via GitHub Actions.

### Quick Start

1. Create a Cloudflare Pages project
2. Generate a Cloudflare API token
3. Configure GitHub Secrets (see `docs/cloudflare-quick-start.md`)
4. Push to `master` branch to trigger deployment

### Documentation

- **Quick Start Guide**: `docs/cloudflare-quick-start.md` - 15-minute setup guide
- **Full Deployment Guide**: `docs/cloudflare-deployment.md` - Comprehensive documentation
- **Changes Summary**: `DEPLOYMENT_CHANGES.md` - Technical details of deployment setup

### CI/CD Workflows

- **Pull Requests** (`.github/workflows/pull-request.yml`): Lint, unit tests, E2E tests
- **Master Branch** (`.github/workflows/master.yml`): Lint, unit tests, build, deploy to Cloudflare Pages

## Project Scope

### In Scope (MVP)

- Email/password authentication with Supabase Auth
- Password reset via one-time links
- AI-powered flashcard generation from pasted text (1,000–10,000 characters)
- Manual creation and editing of individual flashcards (front/back length validation)
- Persistent CRUD interface for flashcards with text search (front/back)
- Event logging (create/edit, source, sessions, timestamps)
- Spaced-repetition session view using external algorithm

### Out of Scope (for MVP)

- Custom spaced-repetition algorithms (Anki, SuperMemo)
- Importing flashcards from PDF, DOCX, or other formats
- Sharing or collaborating on flashcard sets
- Mobile applications

## Project Status

- **Version:** 0.0.1 (initial MVP)
- Active development: core authentication, AI integration, and CRUD features implemented.
- Next milestones: batch review workflows, session analytics, polishing UI/UX.

## License

This project is currently unlicensed. All rights reserved.
