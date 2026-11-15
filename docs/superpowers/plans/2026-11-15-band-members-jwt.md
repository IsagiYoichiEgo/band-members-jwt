# Band Members JWT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a static music-group member portal using the supplied JWT backend.

**Architecture:** `ApiClient` owns REST calls, access-token storage, refresh, and one retry after 401. `app.js` maps login/register/profile state to a single responsive page.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Node built-in test runner

**Spec:** `docs/superpowers/specs/2026-11-15-band-members-jwt-design.md`

## Global Constraints

- Deploy from the repository root on GitHub Pages.
- Send `credentials: "include"` for cookie-backed login, refresh, and logout.
- Never expose or attempt to read the HttpOnly refresh token.

## Review Focus

- A 401 refreshes once and retries with the new access token.
- Refresh failure clears the client session.
- API validation errors become readable Russian messages.
- Empty profile fields remain editable.
- Mobile forms stay usable at 360 px.

### Task 1: JWT API client

**Files:** Create `js/api.js`; test `tests/api.test.js`.

**Interfaces:** Produce `ApiClient` with `register`, `login`, `refresh`, `profile`, `updateProfile`, and `logout`.

- [ ] Write failing tests for login storage, refresh retry, and logout clearing.
- [ ] Run `npm test` and verify the missing implementation fails.
- [ ] Implement the minimum API client and rerun the suite.

### Task 2: Member portal UI

**Files:** Create `index.html`, `styles.css`, `js/app.js`, `README.md`.

**Interfaces:** Consume `ApiClient`; render auth and profile states.

- [ ] Build accessible forms and status messages.
- [ ] Wire boot-time refresh, profile editing, and logout.
- [ ] Verify DOM structure and all tests.

### Task 3: GitHub Pages

**Files:** Create `.nojekyll`.

- [ ] Commit under the configured user identity.
- [ ] Create and push a separate GitHub repository.
- [ ] Enable Pages and verify the deployed URL.
