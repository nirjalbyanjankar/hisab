# Hisab test UI

Run `make services.start` and `make run` from the repository root, then open
http://localhost:3000. The API runs on port 3001.

The frontend uses the live API. You can:

- Create an organization and its owner account, or sign in with organization slug/email/password.
- Add/edit clients and view paginated records.
- Provision team accounts and change roles when permitted.
- Sign in as a viewer or project manager to inspect the different controls.
- View invoices and their items, expenses, and retainers.
- Review your current permissions on My access and refresh them after a role change.

Use two different organization accounts to check that records remain separate.
Invoices, expenses and retainers are read-only here because their write endpoints
have not been implemented; new organizations will see empty lists.

Access tokens are held in React memory only. Reloading the page or signing out
returns you to login. A 401 clears the session; sign in again after token expiry.
Sign-out clears the browser state, but does not revoke an already issued JWT.
The API enforces permissions even if browser controls are altered.

The default API URL is `http://localhost:3001/api/v1`. To change it, copy `.env.example`
to `.env.local`, set `NEXT_PUBLIC_API_URL`, and restart the frontend (rebuild for
production). Set the API's `WEB_ORIGIN` to the frontend origin for CORS.
Never put JWT_SECRET or database credentials in frontend environment variables.

UI components are in `components/`, HTTP helpers and response types in `lib/api.ts`.
Styling uses CSS in `app/globals.css` and the existing local Geist font.

Validation: frontend build, lint, and type checks, plus Chrome tests against a
throwaway database for signup/login, client create/edit, team creation, role changes,
viewer restrictions, organization isolation, financial empty states, and mobile layout.
