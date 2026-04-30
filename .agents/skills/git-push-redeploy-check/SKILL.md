---
name: git-push-redeploy-check
description: Stage, commit, push and validate whether manual redeploy is required for backend/web infrastructure changes.
compatibility: Git repository with remote origin configured
metadata:
  author: latas
  source: local
---

# Git Push + Redeploy Check

Use this skill when the user asks to publish changes quickly and also wants a deployment sanity check.

## Workflow

1. Validate repo state:
- `git status --short`
- `git branch --show-current`
- `git remote -v`

2. Stage and commit:
- `git add -A`
- `git commit -m "<clear summary>"`

3. Push current branch:
- `git push origin <current-branch>`

4. Determine manual redeploy need (heuristics by platform):

Render redeploy is **required** when changes include any of:
- `docker-compose*.yml`, `nginx/**`, `backend/Dockerfile`, `frontend/Dockerfile`, `web/vercel.json`
- dependency manifests: `package.json`, `package-lock.json`, `requirements.txt`
- environment contracts: `.env*`, config loaders, runtime secrets usage
- database migrations or schema changes: `supabase/**`, SQL migrations, ORM model migrations
- background/cron or deployment runtime files: `web/app/api/cron/**`, process managers, CI deploy scripts

Render redeploy is **recommended** when changes include:
- authentication/session middleware/proxy changes
- API contract changes consumed by frontend

Vercel redeploy is **required** when changes include any of:
- anything under `web/app/**`, `web/lib/**`, `web/proxy.ts`, `web/next.config.*`, `web/vercel.json`
- frontend dependency/config changes in `web/package.json`, `web/package-lock.json`, `web/postcss.config.*`, `web/tailwind.config.*`
- env contract/runtime behavior used by Next.js routes or middleware

Vercel redeploy is **recommended** when changes include:
- auth/session changes even if localized to route handlers or middleware
- BFF/proxy contract changes consumed by UI

Vercel redeploy is **not usually needed** for:
- backend-only changes outside `web/**` unless web depends on new backend contract not yet deployed

Manual redeploy is **not usually needed** for:
- static copy/style-only frontend edits (if hosting has auto-deploy from git)

5. Output report:
- commit hash
- pushed branch
- files that triggered redeploy decision
- final verdict for each platform:
  - `Render redeploy: Required | Recommended | Not needed`
  - `Vercel redeploy: Required | Recommended | Not needed`

## Safety

- Never run destructive git commands (`reset --hard`, forced push) unless explicitly requested.
- If commit fails because there are no changes, report and stop.
