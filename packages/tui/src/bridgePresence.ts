import { get } from 'node:http';

// Old and new Wisp hosts both return this small, distinctive response before reading
// credentials. A foreign process on the configured port never receives the user's secret.
const desktopChallenge = '{"error":{"message":"Desktop access secret required"}}';

export function detectExternalBridge(port: number, signal: AbortSignal): Promise<boolean> {
  if (signal.aborted || !Number.isInteger(port) || port < 1 || port > 65535) return Promise.resolve(false);
  return new Promise(resolve => {
    const request = get({
      hostname: '127.0.0.1', port, path: '/codex-desktop/status', agent: false,
      signal: AbortSignal.any([signal, AbortSignal.timeout(900)]),
    }, response => {
      if (response.statusCode !== 401) { response.destroy(); resolve(false); return; }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk: string) => {
        body += chunk;
        if (body.length > desktopChallenge.length) { response.destroy(); resolve(false); }
      });
      response.once('end', () => resolve(body === desktopChallenge));
      response.once('close', () => resolve(false));
      response.once('error', () => resolve(false));
    });
    request.once('error', () => resolve(false));
  });
}
