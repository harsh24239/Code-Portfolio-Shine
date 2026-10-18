import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test, { afterEach, beforeEach } from 'node:test';

const backendDir = fileURLToPath(new URL('../', import.meta.url));
let nextPort = 5300;
let activeServer;

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const startServer = async () => {
  const port = nextPort;
  nextPort += 1;
  const server = spawn(process.execPath, ['start.js'], {
    cwd: backendDir,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      ALLOW_IN_MEMORY_FALLBACK: 'true',
      MONGO_URI: '',
      ADMIN_USERNAME: 'testadmin',
      ADMIN_PASSWORD: 'test-password-123',
      SESSION_SECRET: 'test-session-secret-that-is-long-enough-123',
      PORT: String(port),
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  let stderr = '';
  server.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Test server exited early: ${stderr}`);
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return { server, baseUrl };
    } catch {
      // The child server is still booting.
    }
    await delay(100);
  }

  server.kill('SIGTERM');
  throw new Error(`Test server did not become ready: ${stderr}`);
};

const stopServer = async (server) => {
  if (!server || server.exitCode !== null) return;
  server.kill('SIGTERM');
  await Promise.race([once(server, 'exit'), delay(1000)]);
  if (server.exitCode === null) server.kill('SIGKILL');
};

class TestClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = new Map();
    this.csrfToken = '';
  }

  rememberCookies(response) {
    const setCookies = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [response.headers.get('set-cookie') || ''];
    for (const cookie of setCookies) {
      const pair = cookie.split(';', 1)[0];
      const separator = pair.indexOf('=');
      if (separator > 0) this.cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  }

  async request(pathname, options = {}) {
    const headers = new Headers(options.headers || {});
    if (this.cookies.size > 0) {
      headers.set('Cookie', [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; '));
    }
    const response = await fetch(`${this.baseUrl}${pathname}`, { ...options, headers });
    this.rememberCookies(response);
    const text = await response.text();
    let body = text;
    try {
      body = JSON.parse(text);
    } catch {
      // Keep non-JSON responses available to assertions when needed.
    }
    return { response, body };
  }

  async bootstrapCsrf() {
    const result = await this.request('/api/admin/csrf');
    assert.equal(result.response.status, 200);
    this.csrfToken = result.body.csrfToken;
  }

  async login(password = 'test-password-123') {
    await this.bootstrapCsrf();
    return this.request('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfToken,
      },
      body: JSON.stringify({ username: 'testadmin', password }),
    });
  }
}

beforeEach(async () => {
  activeServer = await startServer();
});

afterEach(async () => {
  await stopServer(activeServer?.server);
  activeServer = null;
});

test('rejects login requests without a CSRF header', async () => {
  const client = new TestClient(activeServer.baseUrl);
  await client.bootstrapCsrf();

  const result = await client.request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testadmin', password: 'test-password-123' }),
  });

  assert.equal(result.response.status, 403);
});

test('keeps sessions independently revocable and records the action', async () => {
  const first = new TestClient(activeServer.baseUrl);
  const second = new TestClient(activeServer.baseUrl);
  assert.equal((await first.login()).response.status, 200);
  assert.equal((await second.login()).response.status, 200);

  const sessions = await first.request('/api/admin/security/sessions');
  assert.equal(sessions.response.status, 200);
  assert.equal(sessions.body.sessions.length, 2);
  assert.equal(sessions.body.sessions.filter((session) => session.current).length, 1);

  const revoke = await first.request('/api/admin/security/sessions/revoke-others', {
    method: 'POST',
    headers: { 'X-CSRF-Token': first.csrfToken },
  });
  assert.equal(revoke.response.status, 200);
  assert.equal(revoke.body.count, 1);

  const revokedSession = await second.request('/api/admin/me');
  assert.equal(revokedSession.response.status, 401);

  const audit = await first.request('/api/admin/security/audit?limit=20');
  assert.equal(audit.response.status, 200);
  assert.ok(audit.body.events.some((event) => event.event === 'login_success'));
  assert.ok(audit.body.events.some((event) => event.event === 'sessions_revoked'));
});

test('locks repeated login failures before accepting the correct password', async () => {
  const client = new TestClient(activeServer.baseUrl);
  await client.bootstrapCsrf();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = await client.request('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': client.csrfToken,
      },
      body: JSON.stringify({ username: 'testadmin', password: 'wrong-password' }),
    });
    assert.equal(result.response.status, 401);
  }

  const fifthFailure = await client.request('/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': client.csrfToken,
    },
    body: JSON.stringify({ username: 'testadmin', password: 'wrong-password' }),
  });
  assert.equal(fifthFailure.response.status, 429);
  assert.equal(fifthFailure.response.headers.get('rateLimit-limit'), '5');

  const correctPassword = await client.request('/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': client.csrfToken,
    },
    body: JSON.stringify({ username: 'testadmin', password: 'test-password-123' }),
  });
  assert.equal(correctPassword.response.status, 429);
});

test('enforces the shared in-memory limiter and clears login throttles', async () => {
  process.env.NODE_ENV = 'test';
  process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';
  process.env.SESSION_SECRET = 'test-session-secret-that-is-long-enough-123';
  const { consumeRateLimit } = await import('../store/rateLimitStore.js');
  const { clearLoginThrottle, getLoginThrottle, registerLoginFailure } = await import('../store/loginThrottleStore.js');
  const key = `test-key-${Date.now()}-${Math.random()}`;

  const first = await consumeRateLimit({ key, limit: 2, windowMs: 60_000 });
  const second = await consumeRateLimit({ key, limit: 2, windowMs: 60_000 });
  const third = await consumeRateLimit({ key, limit: 2, windowMs: 60_000 });
  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);

  const concurrentKey = `concurrent-key-${Date.now()}-${Math.random()}`;
  const concurrentResults = await Promise.all(
    Array.from({ length: 10 }, () => consumeRateLimit({ key: concurrentKey, limit: 5, windowMs: 60_000 })),
  );
  assert.equal(concurrentResults.filter((result) => result.allowed).length, 5);
  assert.equal(Math.max(...concurrentResults.map((result) => result.remaining)), 4);

  for (let attempt = 0; attempt < 5; attempt += 1) await registerLoginFailure(key);
  assert.equal((await getLoginThrottle(key)).blocked, true);
  await clearLoginThrottle(key);
  assert.equal((await getLoginThrottle(key)).blocked, false);
});
