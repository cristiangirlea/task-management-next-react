# Task Board

A Kanban-style task board built with Next.js (App Router), React, TypeScript, Tailwind CSS and daisyUI.
It is the frontend for a Laravel REST API: you sign in, pick a project, and drag tasks between
**To do**, **In progress** and **Done**.

## Prerequisites

- Node.js 22 (see `.github/workflows/ci.yml`)
- The Laravel API running locally (default `http://localhost:8000/api`)

## Environment variables

Copy `.env.example` to `.env.local` and adjust as needed:

| Variable              | Default                     | Purpose                                        |
| --------------------- | --------------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | Base URL of the Laravel API (no trailing slash) |

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000, register an account (or sign in) and create your first project.

## How it talks to the API

The browser calls the Laravel API directly; there is no proxy or Next.js API route in between.
All requests go through the small fetch client in `src/lib/api.ts`, which:

- sends `Accept`/`Content-Type: application/json` and, once signed in, `Authorization: Bearer <token>`;
- unwraps the `{ status, message, data }` envelope and treats `204` as an empty response;
- throws an `ApiError` (`status`, `message`, `errors`) on failure, so forms can show Laravel's
  validation errors field by field;
- on a `401`, clears the stored token and redirects to `/login`.

The token is kept in `localStorage`. `src/lib/auth.tsx` provides `AuthProvider` / `useAuth`,
which validates the stored token with `GET /user` on load.

Drag and drop uses `@dnd-kit`. A drop is applied optimistically and then persisted with
`POST /tasks/reorder` (the destination column's ordered ids, plus the source column's when a task
changes status). If that fails, the board refetches and shows an error toast.

Because the API URL is baked in at build time (`NEXT_PUBLIC_*`), set it before `npm run build`.

## Scripts

| Script               | What it does                          |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Start the dev server on port 3000     |
| `npm run build`      | Production build                      |
| `npm run start`      | Serve the production build            |
| `npm run lint`       | ESLint (`next lint`)                  |
| `npx tsc --noEmit`   | Type-check without emitting           |

## Project layout

```
src/app/            routes: / (board), /login, /register, layout
src/components/     Navbar, RequireAuth, Toast, forms/, auth/, board/
src/hooks/          useProjects, useTasks, useBoardDnd, useSubmit, useToast
src/lib/            api.ts (HTTP client), auth.tsx, board.ts (pure board logic), storage.ts
src/types/          shared API types
```
