# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

PetMatch is a pet-adoption platform (pt-BR) being built as a React + Vite + Tailwind CSS frontend backed by Firebase (Auth, Firestore) and Cloudinary (pet photo storage), deployed to GitHub Pages from a **public** repository.

Pet photos are **not** stored in Firebase Storage — Storage now requires the paid Blaze plan even within the free quota. Photos are uploaded client-side to Cloudinary via an *unsigned* upload preset (`src/lib/cloudinary.js`), which needs no secret key in the client. Only the resulting image URL is saved on the pet's Firestore document.

The original static HTML/CSS mockup (no JS, no build tooling) lives under `mockup/` for visual reference only — it is not part of the app build:

- `mockup/index.html` — landing page
- `mockup/buscar.html` — pet search/listing page
- `mockup/cadastrar.html` — multi-step "register a pet" form
- `mockup/pet.html` — individual pet detail page

Each mockup page is fully self-contained (CSS in a `<style>` block per file, shared color palette redeclared in each `:root`). When porting UI to React components, use these as the source of truth for layout/spacing/colors, and consolidate the duplicated nav/footer/button/card patterns into shared components.

## Public-repo security constraint

This repo is public and hosted via GitHub Pages — there is no server to hide secrets behind. Keep this in mind for every change:

- The Firebase client SDK config (apiKey, authDomain, projectId, etc.) is **not secret by design** — it's meant to ship in the frontend bundle. Real protection comes from Firestore/Storage **Security Rules** and **authorized domains** configured in the Firebase console, not from hiding these values.
- Local Firebase config still goes through `.env.local` (gitignored) for convenience; production values are injected via GitHub Actions Secrets at build time — never hardcoded in committed files.
- Never commit paid third-party API keys, server credentials, or anything that assumes a trusted backend — there isn't one here.

See the full build plan at `C:\Users\renat\.claude\plans\timo-agora-que-o-parallel-mccarthy.md` for the phased implementation order (design system → Firebase setup/rules → MVP features → CI/CD → v1.1).

## Commands

Standard Vite project:
- `npm run dev` — local dev server
- `npm run build` — production build to `dist/`
- `npm run lint` — ESLint
