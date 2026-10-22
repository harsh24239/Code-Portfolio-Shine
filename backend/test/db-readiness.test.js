import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import { isDbConnected } from '../config/db.js';

test('database readiness recovers after a disconnect and remains ready on a non-disconnecting error', () => {
  const connection = mongoose.connection;
  connection.readyState = 1;
  assert.equal(isDbConnected, true);
  connection.readyState = 0;
  assert.equal(isDbConnected, false);
  connection.readyState = 1;
  assert.equal(isDbConnected, true, 'a reconnected database must make API routes available again');
  connection.emit('error', new Error('simulated non-disconnecting error'));
  assert.equal(isDbConnected, true);
  connection.readyState = 0;
  assert.equal(isDbConnected, false);
});
