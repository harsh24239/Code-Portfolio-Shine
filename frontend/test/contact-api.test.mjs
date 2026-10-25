import assert from 'node:assert/strict';
import test, { after, afterEach } from 'node:test';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';

const source = await readFile(new URL('../src/lib/contact-api.ts', import.meta.url), 'utf8');
const { code } = await transformWithEsbuild(source, 'contact-api.ts', { loader: 'ts', target: 'es2022' });
const { submitContact, contactEmailLink } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const realFetch = globalThis.fetch;
globalThis.window = { setTimeout, clearTimeout };
afterEach(() => { globalThis.fetch = realFetch; });
after(() => { delete globalThis.window; });
const fields = { name: 'Guest', email: 'guest@example.net', subject: 'Work', message: 'Hello' };

test('distinguishes provider acceptance from a stored-only or legacy receipt', async () => {
  for (const delivery of ['accepted', 'unavailable', undefined]) {
    globalThis.fetch = async (_url, request) => {
      assert.deepEqual(JSON.parse(request.body), fields);
      return Response.json({ messageId: 'message-1', message: 'Received', emailDelivery: delivery }, { status: 201 });
    };
    assert.equal(await submitContact('/api/contact', fields), delivery || 'unknown');
  }
});

test('rejects HTML, failed requests and incomplete receipts instead of claiming a sent email', async () => {
  for (const response of [new Response('<html>Page</html>'), Response.json({}, { status: 503 }), Response.json({ message: 'OK' }), Response.json({ messageId: {}, message: 'OK', emailDelivery: 'accepted' })]) {
    globalThis.fetch = async () => response;
    await assert.rejects(submitContact('/api/contact', fields));
  }
});

test('encodes the preserved message safely in the direct email fallback', () => {
  const link = contactEmailLink('owner@example.com', { ...fields, subject: 'A & B? #ideas', message: 'First line\nSecond & third' });
  const url = new URL(link);
  assert.equal(url.protocol, 'mailto:');
  assert.equal(decodeURIComponent(url.pathname), 'owner@example.com');
  assert.equal(url.searchParams.get('subject'), 'A & B? #ideas');
  assert.equal(url.searchParams.get('body'), 'First line\nSecond & third\n\nFrom: Guest\nReply to: guest@example.net');
  assert.equal(url.searchParams.has('bcc'), false);
});
