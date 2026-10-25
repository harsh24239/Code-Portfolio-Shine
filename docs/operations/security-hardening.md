# Authentication and request protection

Second-factor verification reserves one of five challenge attempts before checking a code. MongoDB applies that reservation atomically. A successful login must redeem the challenge once and claim either an unused authenticator time step or unused recovery code in a conditional account update. Challenges are tied to the credential version that passed password verification. Password changes or MFA changes therefore invalidate outstanding challenges.

Authenticated requests check the current account version in MongoDB rather than trusting a process-local cache. Sensitive password rechecks also use the current account record. New passwords must fit bcrypt's 72-byte input limit; existing passwords are not changed or truncated by this update.

Login, MFA verification and contact submissions use separate rate-limit namespaces. Request bodies are capped at 128 KiB, parser errors return generic JSON, malformed cookies are ignored, and verification codes are never printed when email configuration is missing. Production contact messages remain in MongoDB without accumulating an unbounded second copy in process memory; the explicitly temporary development inbox keeps at most 100 messages.

## Frontend hosting and local development

`frontend/vercel.json` supplies the production CSP and browser security headers. Its API allowlist is intentionally limited to the current Render backend; update it when changing the backend hostname. The existing font domains are allowed for compatibility with the deployed typography. Inline styles remain allowed because React and the animation system use them; inline scripts and script evaluation are not allowed.

The development server binds to loopback by default. Explicit LAN testing may set `DEV_SERVER_HOST`, but normal local work should retain `127.0.0.1`. Restart a running preview after updating Vite so it uses the patched development server code.

## Verification

The regression suite exercises concurrent challenge reservations, challenge redemption, recovery-code replay, real authenticator-code validation, credential-version revocation, independent endpoint budgets, malformed requests, password length handling and contact-cache bounds. These tests use disposable local accounts and mocked provider delivery. They do not change a live account's password, MFA settings or recovery codes.

Live verification is limited to low-volume unauthenticated GET requests for response headers, access denial and accidental file exposure. No brute-force attempts, production MFA changes, message sends or destructive probes are part of this review. Current-source secret-pattern checks exclude real environment files and never print matched values; they do not establish that every historical Git revision is secret-free.

Implementation references: [MongoDB single-document atomicity](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/) and [OWASP MFA guidance](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).
