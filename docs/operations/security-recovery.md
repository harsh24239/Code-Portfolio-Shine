# Security and Recovery Runbook

This runbook covers the live Shadow HQ admin system hosted on Render with MongoDB Atlas as its persistent store.

## Current security controls

- Authenticator-app MFA with one-time recovery codes.
- MongoDB-backed opaque admin sessions with 30-minute expiry.
- CSRF protection for unsafe admin requests.
- Active-session listing and revocation from the Security Center.
- MongoDB-backed login failure throttling and shared request rate limiting.
- Admin audit events retained for 180 days through a MongoDB TTL index.
- GitHub Actions checks for backend tests, frontend typecheck/build, and dependency audits.

## Secret handling

- Never commit `MONGO_URI`, `SESSION_SECRET`, `MFA_ENCRYPTION_KEY`, admin passwords, recovery codes, or session cookies.
- Use Render environment variables and local private environment files only.
- Use placeholders such as `<MONGO_URI>` in commands and tickets.
- Redact IP addresses, user agents, and audit details before sharing diagnostic output outside the project.

## MongoDB Atlas backup verification

### Configure

1. Confirm Atlas backup is enabled for the production cluster according to the current Atlas plan.
2. Confirm the backup policy has a retention period of at least 180 days, matching the audit-log retention window.
3. Record the Atlas project, cluster, backup policy owner, and recovery contact in the private team system. Do not add credentials to this repository.

### Verify a restore

Run this procedure at least once before calling the system recovery-ready, and repeat it after major schema changes:

1. Select a recent Atlas snapshot or point-in-time restore.
2. Restore into an isolated temporary cluster or project. Never restore directly over production for a drill.
3. Use a temporary `MONGO_URI` with a separate `SESSION_SECRET` and `MFA_ENCRYPTION_KEY`.
4. Confirm the restored database contains the expected collections, including:
   - `admins`
   - `adminsessions`
   - `adminauditlogs`
   - `adminloginthrottles`
   - `ratelimitcounters`
   - `profiles`, `projects`, `skills`, `focusareas`, and `messages`
5. Start the backend against the temporary restore and run:

   ```sh
   cd backend
   npm ci
   npm test
   npm audit --omit=dev
   ```

6. Verify `/health` returns `OK`, `/api/admin/csrf` returns a CSRF token, and unauthenticated Security Center endpoints return `401`.
7. Use a temporary admin account or an approved test credential to verify login, MFA, session listing, audit read-back, and session revocation.
8. Record the restore timestamp, snapshot identifier, collection checks, test result, and cleanup confirmation in the private operations log.
9. Delete the temporary restored cluster after the drill. Never copy production secrets or recovery codes into the test environment.

### Recovery acceptance criteria

A restore drill is successful only when:

- Portfolio content is readable from the restored database.
- Admin authentication can be bootstrapped without exposing stored password hashes or MFA secrets.
- Audit records can be queried with pagination and filters.
- A restored session can be revoked.
- The live cluster remains unchanged during the drill.

## Admin security incident response

1. Open the live admin panel and use **Security Center → Active Sessions → Revoke Other Sessions**.
2. If the current session may be compromised, revoke it as well and sign in again.
3. Change the admin password. The application invalidates all existing sessions after a password change.
4. If MFA may be compromised, disable and re-enroll MFA using a trusted authenticator device. Store the newly generated recovery codes offline.
5. Review the audit log for `login_success`, `login_failure`, `mfa_failure`, `session_revoked`, `password_changed`, and `username_changed` events.
6. Preserve the relevant event timestamps and request metadata in the private incident record. Do not copy raw secrets or full session tokens.
7. If `SESSION_SECRET` is suspected, rotate it in Render and redeploy. Existing session hashes will no longer validate, forcing all administrators to sign in again.
8. If `MFA_ENCRYPTION_KEY` is suspected, stop and plan a controlled MFA re-enrollment. Do not replace it casually: existing encrypted TOTP secrets require a deliberate migration or re-enrollment plan.

## Render rollback procedure

Use this procedure when a deployment fails health checks or breaks an authenticated admin flow:

1. Check the GitHub Actions run for the deployed commit and confirm whether the failure is code, dependency, configuration, or database related.
2. Check Render deploy logs and `/health` before changing production configuration.
3. Select the last known-good commit whose CI run succeeded.
4. Prefer a normal revert commit on `main` over force-pushing or rewriting history. Push the revert and let Render deploy it.
5. Wait for Render to report the service healthy, then verify:

   ```sh
   curl -sS https://code-portfolio-backend.onrender.com/health
   curl -sS https://code-portfolio-backend.onrender.com/api/admin/csrf
   ```

6. Confirm unauthenticated requests to `/api/admin/security/sessions` and `/api/admin/security/audit` return `401`.
7. Sign in through the admin panel and verify MFA, Security Center, portfolio reads, and one harmless admin read operation.
8. Record the failed commit, rollback commit, Render deploy timestamp, health result, and follow-up issue in the private operations log.

Do not use `git push --force`, `git reset --hard`, or a destructive database rollback as an emergency shortcut.

## Routine release checklist

Before merging or deploying a security-related change:

```sh
cd backend
npm ci
npm test
npm audit --omit=dev

cd ../frontend
npm ci
npm run typecheck
npm run build
npm audit --omit=dev
```

Then confirm the GitHub Actions CI run is successful before promoting the commit to Render. After deployment, check `/health`, CSRF bootstrap, and the admin Security Center from a real browser session.

The GitHub Actions workflow is stored at `.github/workflows/ci.yml`.
