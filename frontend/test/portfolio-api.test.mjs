import assert from 'node:assert/strict';
import test, { after, afterEach } from 'node:test';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';

const source = await readFile(new URL('../src/lib/portfolio-api.ts', import.meta.url), 'utf8');
const { code } = await transformWithEsbuild(source, 'portfolio-api.ts', { loader: 'ts', target: 'es2022' });
const { fetchPortfolio, mergeProfile } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const originalFetch = globalThis.fetch;
globalThis.window = { setTimeout, clearTimeout };
afterEach(() => { globalThis.fetch = originalFetch; });
after(() => { delete globalThis.window; });

test('loads empty collections without restoring deleted default items', async () => {
  const payload = { profile: { title1: 'CUSTOM' }, projects: [], skills: [], focusAreas: [] };
  globalThis.fetch = async () => Response.json(payload);
  assert.deepEqual(await fetchPortfolio('/api/portfolio', new AbortController().signal), payload);
});

test('rejects HTML from an unconfigured frontend API route', async () => {
  globalThis.fetch = async () => new Response('<html>Portfolio</html>', { headers: { 'Content-Type': 'text/html' } });
  await assert.rejects(fetchPortfolio('/api/portfolio', new AbortController().signal), /instead of JSON/);
});

test('rejects backend outages and incomplete responses instead of reporting a successful load', async () => {
  globalThis.fetch = async () => Response.json({ message: 'Unavailable' }, { status: 503 });
  await assert.rejects(fetchPortfolio('/api/portfolio', new AbortController().signal), /503/);
  globalThis.fetch = async () => Response.json({ profile: {} });
  await assert.rejects(fetchPortfolio('/api/portfolio', new AbortController().signal), /incomplete data/);
});

test('preserves saved long text and safely fills missing profile fields', () => {
  const defaults = { subtext: 'Default', projectsShipped: '6+', linkedin: '' };
  const longText = 'Saved biography. '.repeat(20);
  assert.deepEqual(mergeProfile(defaults, { subtext: longText, projectsShipped: null, linkedin: '' }), {
    subtext: longText, projectsShipped: '6+', linkedin: '',
  });
});

test('cancels an in-flight request when the page unmounts', async () => {
  globalThis.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });
  const controller = new AbortController();
  const pending = fetchPortfolio('/api/portfolio', controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});
