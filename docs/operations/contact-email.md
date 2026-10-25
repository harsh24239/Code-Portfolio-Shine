# Portfolio contact email

The contact endpoint saves the message in MongoDB first and then waits for the email provider to accept it. The response includes `emailDelivery: "accepted"` or `"unavailable"`; a saved message is never reported as an emailed message. Provider acceptance does not guarantee inbox delivery. The admin inbox keeps the message in either case.

## Render setup

The existing backend uses Render Free, which blocks outbound SMTP ports 25, 465 and 587. Contact notifications therefore prefer Resend's HTTPS API when its key is configured. Existing SMTP settings and admin OTP behavior are retained.

Add these values privately in the backend service's Render environment, never in frontend variables, source code or chat:

- `RESEND_API_KEY`: a Resend key with sending access.
- `CONTACT_FROM_EMAIL`: an address on a verified sending domain, optionally with a display name such as `Harsh Portfolio <contact@your-domain.com>`.
- `CONTACT_NOTIFY_EMAIL`: `kumarharsh1851@gmail.com`.

The verified sender belongs to the portfolio. The visitor's email is set as Reply-To, so a normal reply in the owner's inbox goes to the visitor. Notifications include both plain text and escaped HTML styled in the portfolio's paper and graphite palette. Provider errors are logged without message bodies or credentials.

Resend's `onboarding@resend.dev` sender is for testing and can only send to the email associated with the Resend account. A production sending domain must be verified before using its address as `CONTACT_FROM_EMAIL`.

The updated backend source must be deployed as well as the frontend. Merely adding variables does not update the running backend code. After deployment, submit one owner-approved test message and check both the provider's delivery status and the owner's inbox. Do not interpret a saved-only receipt as confirmation of email delivery.

## Frontend behavior

The form waits for a valid JSON receipt. It reports a sent email only when the provider accepted it. When only the inbox copy is confirmed, it preserves the form text and offers a prefilled direct-email link. A saved message cannot be resubmitted unchanged by repeatedly clicking the button. Failed or unconfirmed requests preserve the typed message. Form fields are disabled while a request is pending.

## Validation

Backend tests mock the provider: fixed recipient and Reply-To routing, HTML escaping, error handling, missing sender configuration and persistent inbox retention. No real emails are sent by the test suite. Frontend tests distinguish accepted, saved-only and legacy responses and reject HTML or incomplete receipts.

References: [Render Free limits](https://render.com/docs/free#other-limitations), [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email), [Resend testing sender limits](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).
