import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import { once } from 'node:events';
import express from 'express';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'development';
process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';
process.env.SESSION_SECRET = 'test-hardening-secret-not-for-production-123456';
const { createMfaChallenge, consumeMfaChallenge, redeemMfaChallenge } = await import('../store/sessionStore.js');
const { claimMfaProof } = await import('../store/mfaProofStore.js');
const { memoryStore } = await import('../store/memoryStore.js');
const { createRateLimiter } = await import('../middleware/rateLimit.js');
const { parseCookies } = await import('../utils/cookies.js');
const { protect } = await import('../middleware/auth.js');
const { Admin } = await import('../models/Admin.js');
const { AdminSession } = await import('../models/AdminSession.js');
const { sendPasswordResetOTP } = await import('../config/email.js');
const { createTotpSetup, generatePreviewCode, verifyTotp } = await import('../utils/totp.js');

const proofAccount = () => {
  memoryStore.adminCredentials = {
    ...memoryStore.adminCredentials, tokenVersion: 7, mfaEnabled: true,
    mfaSecret: { ciphertext: 'test-ciphertext' }, mfaLastUsedStep: -1,
    mfaBackupCodes: [{ hash: 'test-recovery-hash', usedAt: null }],
  };
  return { adminId: 'test-admin', tokenVersion: 7, secretCiphertext: 'test-ciphertext' };
};

test('50 concurrent MFA requests reserve only five attempts and redeem a challenge once', async () => {
  const challenge = await createMfaChallenge('test-admin', 7);
  const attempts = await Promise.all(Array.from({ length: 50 }, () => consumeMfaChallenge(challenge.token)));
  const reserved = attempts.filter(Boolean);
  assert.equal(reserved.length, 5);
  assert.deepEqual(reserved.map(attempt => attempt.attempts).sort(), [1, 2, 3, 4, 5]);
  assert.ok(reserved.every(attempt => attempt.tokenVersion === 7));
  const redeemed = await Promise.all(Array.from({ length: 20 }, () => redeemMfaChallenge(challenge.token)));
  assert.equal(redeemed.filter(Boolean).length, 1);
  assert.equal(await consumeMfaChallenge(challenge.token), null);
});

test('expired or unattempted MFA challenges cannot be redeemed', async () => {
  const unused = await createMfaChallenge('test-admin', 7);
  assert.equal(await redeemMfaChallenge(unused.token), false);
  const expired = await createMfaChallenge('test-admin', 7);
  expired.expiresAt.setTime(Date.now() - 1);
  assert.equal(await consumeMfaChallenge(expired.token), null);
  assert.equal(await redeemMfaChallenge(expired.token), false);
});

test('a TOTP time step can be claimed only once and is bound to current credentials', async () => {
  const account = proofAccount();
  const results = await Promise.all(Array.from({ length: 20 }, () => claimMfaProof({ ...account, timeStep: 123 })));
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(await claimMfaProof({ ...account, timeStep: 122 }), false);
  assert.equal(await claimMfaProof({ ...account, tokenVersion: 6, timeStep: 124 }), false);
  assert.equal(await claimMfaProof({ ...account, secretCiphertext: 'old-secret', timeStep: 124 }), false);
  memoryStore.adminCredentials.mfaEnabled = false;
  assert.equal(await claimMfaProof({ ...account, timeStep: 124 }), false);
});

test('real authenticator codes still validate and reject a previously used time step', async () => {
  const setup = createTotpSetup('fixture');
  const code = await generatePreviewCode(setup.secret);
  const result = await verifyTotp(setup.secret, code);
  assert.equal(result.valid, true);
  assert.ok(Number.isInteger(result.timeStep));
  assert.equal((await verifyTotp(setup.secret, code, result.timeStep)).valid, false);
});

test('parallel verification cannot redeem the same recovery code twice', async () => {
  const account = proofAccount();
  const results = await Promise.all(Array.from({ length: 20 }, () => claimMfaProof({ ...account, backupHash: 'test-recovery-hash' })));
  assert.equal(results.filter(Boolean).length, 1);
  assert.ok(memoryStore.adminCredentials.mfaBackupCodes[0].usedAt instanceof Date);
});

test('session checks use the current database credential version, not a stale process cache', async (t) => {
  mongoose.connection.readyState = 1;
  t.after(() => { mongoose.connection.readyState = 0; });
  memoryStore.adminCredentials.tokenVersion = 3;
  const session = { _id: 'session-1', adminId: 'admin-1', tokenVersion: 3, mfaVerified: true, expiresAt: new Date(Date.now() + 10000) };
  t.mock.method(AdminSession, 'findOne', async () => ({ ...session, toObject: () => session }));
  t.mock.method(Admin, 'findById', () => ({ select: async () => ({ tokenVersion: 4, mfaEnabled: true }) }));
  const revoked = t.mock.method(AdminSession, 'deleteOne', async () => ({ deletedCount: 1 }));
  let status;
  let advanced = false;
  const res = { status(code) { status = code; return this; }, json() {} };
  await protect({ headers: { cookie: 'portfolio_admin_session=fixture-token' } }, res, () => { advanced = true; });
  assert.equal(status, 401);
  assert.equal(advanced, false);
  assert.equal(revoked.mock.callCount(), 1);
});

test('different endpoint rate limits do not share counters for the same client', async (t) => {
  const scope = crypto.randomUUID();
  const app = express();
  app.get('/login', createRateLimiter({ namespace: `${scope}:login`, limit: 2, windowMs: 60000, message: 'Limited' }), (req, res) => res.json({ ok: true }));
  app.get('/contact', createRateLimiter({ namespace: `${scope}:contact`, limit: 3, windowMs: 3600000, message: 'Limited' }), (req, res) => res.json({ ok: true }));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const expected of [200, 200, 429]) assert.equal((await fetch(`${base}/login`)).status, expected);
  assert.equal((await fetch(`${base}/contact`)).status, 200);
});

test('malformed cookie encoding is ignored without dropping valid cookies', () => {
  assert.deepEqual(parseCookies('broken=%E0%A4%A; valid=hello%20there; no-equals; portfolio_admin_session=fixture'), {
    valid: 'hello there', portfolio_admin_session: 'fixture',
  });
});

test('missing email configuration never writes a verification code to logs', async (t) => {
  const oldUser = process.env.EMAIL_USER;
  const oldPass = process.env.EMAIL_PASS;
  delete process.env.EMAIL_USER;
  delete process.env.EMAIL_PASS;
  t.after(() => {
    if (oldUser === undefined) delete process.env.EMAIL_USER; else process.env.EMAIL_USER = oldUser;
    if (oldPass === undefined) delete process.env.EMAIL_PASS; else process.env.EMAIL_PASS = oldPass;
  });
  const info = t.mock.method(console, 'info', () => {});
  assert.equal(await sendPasswordResetOTP({ otpCode: '123456' }), false);
  assert.ok(!info.mock.calls.flatMap(call => call.arguments).join(' ').includes('123456'));
});
