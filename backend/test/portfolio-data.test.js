import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import express from 'express';
import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { Skill } from '../models/Skill.js';
import { FocusArea } from '../models/FocusArea.js';
import { Profile } from '../models/Profile.js';

process.env.ALLOW_IN_MEMORY_FALLBACK = 'false';
const { default: publicRoutes } = await import('../routes/publicRoutes.js');
const { memoryStore } = await import('../store/memoryStore.js');

test('public API recovers after reconnect and returns intentionally empty database collections', async (t) => {
  t.mock.method(Profile, 'findOne', async () => null);
  for (const Model of [Project, Skill, FocusArea]) {
    t.mock.method(Model, 'find', () => ({ sort: async () => [] }));
  }
  const app = express();
  app.use('/api', publicRoutes);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  t.after(() => { mongoose.connection.readyState = 0; });
  const url = `http://127.0.0.1:${server.address().port}/api/portfolio`;

  mongoose.connection.readyState = 1;
  assert.ok(memoryStore.projects.length > 0, 'defaults are initially cached');
  let response = await fetch(url);
  assert.equal(response.status, 200);
  let data = await response.json();
  for (const key of ['projects', 'skills', 'focusAreas']) {
    assert.deepEqual(data[key], []);
    assert.deepEqual(memoryStore[key], []);
  }

  mongoose.connection.readyState = 0;
  response = await fetch(url);
  assert.equal(response.status, 503, 'database outage must block persistent operations');
  mongoose.connection.readyState = 1;
  response = await fetch(url);
  assert.equal(response.status, 200, 'recovery must restore API access without a process restart');
});
