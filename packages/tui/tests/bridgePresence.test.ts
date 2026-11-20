import { expect, test } from 'bun:test';
import { createServer, type RequestListener } from 'node:http';
import { detectExternalBridge } from '../src/bridgePresence';

async function probe(handler: RequestListener) {
  const server = createServer(handler);
  try {
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected a loopback port');
    return await detectExternalBridge(address.port, new AbortController().signal);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

test('recognizes an existing Wisp listener without sending credentials', async () => {
  let route: string | undefined;
  let hasCredentials = true;
  const present = await probe((req, res) => {
    route = req.url;
    hasCredentials = !!(req.headers.authorization || req.headers['x-api-key']);
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'Desktop access secret required' } }));
  });
  expect(present).toBe(true);
  expect(route).toBe('/codex-desktop/status');
  expect(hasCredentials).toBe(false);
});

test('an unrelated local server, redirect or oversized error is not a running Bridge', async () => {
  expect(await probe((_, res) => res.end('ready'))).toBe(false);
  expect(await probe((_, res) => { res.writeHead(302, { Location: '/other' }); res.end(); })).toBe(false);
  expect(await probe((_, res) => { res.writeHead(401); res.end('x'.repeat(2048)); })).toBe(false);
});
