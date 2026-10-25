import assert from 'node:assert/strict';
import { once } from 'node:events';
import test, { afterEach } from 'node:test';
import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { Message } from '../models/Message.js';
import { sendContactEmailNotification } from '../config/email.js';

process.env.ALLOW_IN_MEMORY_FALLBACK = 'false';
const { default: publicRoutes } = await import('../routes/publicRoutes.js');
const keys = ['RESEND_API_KEY', 'CONTACT_FROM_EMAIL', 'CONTACT_NOTIFY_EMAIL', 'NOTIFY_EMAIL', 'EMAIL_USER', 'EMAIL_PASS'];
const savedEnv = Object.fromEntries(keys.map(key => [key, process.env[key]]));
const realFetch = globalThis.fetch;
afterEach(() => {
  for (const key of keys) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  mongoose.connection.readyState = 0;
});

const configure = () => {
  for (const key of keys) delete process.env[key];
  process.env.RESEND_API_KEY = 'test-key-not-a-secret';
  process.env.CONTACT_FROM_EMAIL = 'Portfolio <contact@example.com>';
  process.env.CONTACT_NOTIFY_EMAIL = 'owner@example.com';
};
const fields = { name: '<Guest>', email: 'guest@example.net', subject: 'Work & ideas', message: 'Hello <script>\nSecond line', messageId: 'message-1' };

test('sends contact mail over HTTPS to the owner with escaped content and the visitor as Reply-To', async (t) => {
  configure();
  t.mock.method(nodemailer, 'createTransport', () => { throw new Error('SMTP must not be used'); });
  t.mock.method(globalThis, 'fetch', async (url, request) => {
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(request.headers.Authorization, 'Bearer test-key-not-a-secret');
    assert.equal(request.headers['Idempotency-Key'], 'portfolio-contact-message-1');
    const mail = JSON.parse(request.body);
    assert.deepEqual(mail.to, ['owner@example.com']);
    assert.equal(mail.from, 'Portfolio <contact@example.com>');
    assert.equal(mail.reply_to, 'guest@example.net');
    assert.ok(mail.html.includes('&lt;Guest&gt;'));
    assert.ok(mail.html.includes('&lt;script&gt;'));
    assert.ok(!mail.html.includes('<script>'));
    assert.ok(mail.text.includes('Hello <script>\nSecond line'));
    assert.ok(request.signal instanceof AbortSignal);
    return Response.json({ id: 'provider-message-1' });
  });
  assert.equal(await sendContactEmailNotification(fields), true);
});

test('never reports email acceptance on provider errors, invalid receipts or connection failures', async (t) => {
  configure();
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ message: 'Rejected' }, { status: 403 }));
  assert.equal(await sendContactEmailNotification(fields), false);
  mock.mock.mockImplementation(async () => Response.json({}));
  assert.equal(await sendContactEmailNotification(fields), false);
  mock.mock.mockImplementation(async () => { throw new Error('Connection failed'); });
  assert.equal(await sendContactEmailNotification(fields), false);
});

test('missing sender configuration does not attempt a network call', async (t) => {
  configure();
  delete process.env.CONTACT_FROM_EMAIL;
  const request = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Must not send'); });
  assert.equal(await sendContactEmailNotification(fields), false);
  assert.equal(request.mock.callCount(), 0);
});

test('contact endpoint retains the saved message when email is unavailable and confirms provider acceptance accurately', async (t) => {
  configure();
  mongoose.connection.readyState = 1;
  const create = t.mock.method(Message, 'create', async (data) => ({ ...data, _id: 'saved-message-1', createdAt: new Date() }));
  let accepted = false;
  const send = t.mock.method(globalThis, 'fetch', async () => accepted ? Response.json({ id: 'provider-1' }) : Response.json({ message: 'Unavailable' }, { status: 503 }));
  const app = express();
  app.use(express.json());
  app.use('/api', publicRoutes);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const post = body => realFetch(`http://127.0.0.1:${server.address().port}/api/contact`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  let response = await post({ ...fields, email: 'invalid' });
  assert.equal(response.status, 400);
  assert.equal(create.mock.callCount(), 0);
  assert.equal(send.mock.callCount(), 0);
  response = await post(fields);
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { message: 'Message received.', messageId: 'saved-message-1', emailDelivery: 'unavailable' });
  accepted = true;
  response = await post(fields);
  assert.equal((await response.json()).emailDelivery, 'accepted');
  assert.equal(create.mock.callCount(), 2, 'each valid request keeps its persistent inbox copy');
});
