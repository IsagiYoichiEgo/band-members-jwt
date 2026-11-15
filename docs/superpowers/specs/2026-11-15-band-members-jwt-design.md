# Band Members JWT — design

## Intent

Create a small Russian-language site for registering members of a music group. It must demonstrate the backend JWT flow clearly enough for coursework: registration, login, access-token use, refresh through the HttpOnly cookie, profile viewing/editing, and logout.

## Constraints

- Static HTML, CSS, and JavaScript suitable for GitHub Pages.
- Backend: `https://inai-col3.fishrungames.com`.
- Refresh token stays in the backend-managed HttpOnly cookie; requests that use it send `credentials: "include"`.
- Access token is kept in `sessionStorage` and sent as `Authorization: Bearer …`.
- The UI is responsive, keyboard accessible, and written in Russian.

## Approach

Use a buildless, dependency-free client. A small API module owns token refresh and retries one failed authorized request. The page controller owns forms and views. The visual direction borrows from rehearsal-room set lists: graphite, paper white, electric blue, and coral, with a bold condensed heading rhythm.

## Non-goals

No custom backend, administration panel, social login, or file upload.
