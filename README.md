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

## Settings and invitations

`/settings` manages the workspace: owners can rename it, remove members, invite people by email
(`POST /tenant/invitations`) and revoke pending invitations; members see the same lists read-only.
An invitation is emailed by the API and also shown as a link you can copy; it points at
`/invite/[token]`, a public page that previews the invite (`GET /invitations/{token}`) and, once
the invitee picks a name and password, creates their account and signs them in. Settings also
issues personal API tokens (`/tokens`) for MCP clients: the plain token is shown exactly once,
together with the `claude mcp add --transport http task-board <API origin>/mcp --header
"Authorization: Bearer <token>"` command that connects Claude Code to the API's `/mcp` endpoint.
A `403` from any owner-only action is shown as "Only workspace owners can do this."

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
src/app/            routes: / (board), /login, /register, /settings, /invite/[token], layout
src/components/     Navbar, RequireAuth, Toast, forms/, auth/, board/, settings/, invite/
src/hooks/          useProjects, useTasks, useBoardDnd, useResource, useSubmit, useToast
src/lib/            api.ts (HTTP client), auth.tsx, board.ts (pure board logic), storage.ts,
                    workspace.ts (settings helpers), clipboard.ts
src/types/          shared API types
```
