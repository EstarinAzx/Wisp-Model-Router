// Run explicitly with Bun and Claude Code >=2.1.322 installed. No real-provider requests or credentials.
import { strict as assert } from 'assert';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { createServer } from 'net';
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { createBridgeServer, type BridgeDeps } from '@wisp/core';

const dir = mkdtempSync(join(tmpdir(), 'wisp-native-claude-'));
const launcher = process.env.WISP_CONTEXT_TEST_BINARY ? [resolve(process.env.WISP_CONTEXT_TEST_BINARY), 'claude-wisp']
  : [process.execPath, resolve(import.meta.dir, '../src/index.tsx'), 'claude-wisp'];
const probe = createServer();
await new Promise<void>(done => probe.listen(0, '127.0.0.1', done));
const port = (probe.address() as { port: number }).port;
await new Promise<void>(done => probe.close(() => done()));
const provider = { id: 'xai', label: 'Grok fixture', kind: 'xai-oauth' as const, baseUrl: 'https://cli-chat-proxy.grok.com/v1', defaultModel: 'grok-4.7', apiKeyEnv: '' };
const limits: Record<string, number> = { 'fixture-128k': 128000, 'fixture-400k': 400000, 'fixture-500k': 500000, 'fixture-1m': 1000000 };
const sent: string[] = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
  if (String(url) === 'https://models.dev/api.json') return new Response(JSON.stringify({ xai: { models: Object.fromEntries(Object.entries(limits).map(([model, context]) => [model, { limit: { context } }])) } }));
  assert(String(url).includes('grok.com') || String(url).includes('x.ai'), 'Unexpected fixture network request');
  sent.push(JSON.parse(init!.body as string).model);
  return new Response('event: response.output_text.delta\ndata: {"delta":"OK"}\n\nevent: response.completed\ndata: {"response":{"usage":{"input_tokens":10,"output_tokens":1},"output":[{"type":"message","content":[{"type":"output_text","text":"OK"}]}]}}\n\n');
}) as typeof fetch;
const deps: BridgeDeps = {
  providers: [provider], modelMap: () => ({}), customBaseUrl: () => '', keyFor: async () => '', clientFor: async () => undefined,
  codexSignedIn: async () => false, codexCreds: async () => undefined, anthropicSignedIn: async () => false, anthropicCreds: async () => undefined,
  xaiSignedIn: async () => true, xaiCreds: async () => ({ accessToken: 'synthetic' }), effort: () => 'low', activeProviderId: () => 'xai',
  routingMap: () => ({ families: {}, aliases: Object.keys(limits).map(name => ({ name, target: { providerId: 'xai', model: name } })) }),
  aliasPickerShowsModel: () => false, aliasOnlyModels: () => true, port: () => port, accessSecret: () => 'synthetic-secret', log: () => {},
};
const bridge = createBridgeServer(deps);
await bridge.start();
const home = join(dir, 'wisp'); mkdirSync(home);
writeFileSync(join(home, 'config.json'), JSON.stringify({ provider: 'xai', routing: deps.routingMap(), bridge: { port } }));
writeFileSync(join(home, 'auth.json'), JSON.stringify({ bridgeSecret: 'synthetic-secret' }));
try {
  for (const [model, expected] of Object.entries(limits)) {
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => ['PATH', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'TEMP', 'TMP', 'PATHEXT', 'SYSTEMDRIVE'].includes(key.toUpperCase())));
    const child = Bun.spawn([...launcher, '--exact-context', '--model', model,
      '-p', 'Reply OK.', '--output-format', 'json', '--system-prompt', 'Reply OK.', '--safe-mode', '--setting-sources', '',
      '--no-session-persistence', '--tools', '', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}'], {
      cwd: dir, env: { ...env, WISP_HOME: home, CLAUDE_CONFIG_DIR: join(dir, model), CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' }, stdout: 'pipe', stderr: 'pipe',
    });
    const timeout = setTimeout(() => child.kill(), 30000);
    const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    clearTimeout(timeout);
    assert.equal(code, 0, stderr);
    const result = JSON.parse(stdout);
    assert.equal(result.is_error, false, stdout);
    const windows = Object.values(result.modelUsage).map((usage: any) => usage.contextWindow);
    assert(windows.includes(expected), `Expected ${expected}, got ${JSON.stringify(windows)}`);
    assert.equal(sent.at(-1), model);
    console.log(JSON.stringify({ model, expected, windows, routed: sent.at(-1), passed: true }));
  }
  for (const exact of [false, true]) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => ['PATH', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'TEMP', 'TMP', 'PATHEXT', 'SYSTEMDRIVE'].includes(key.toUpperCase())));
  if (!exact) {
    // Native discovery refreshes asynchronously; warm it through a real launch before inspecting the SDK snapshot.
    const warm = Bun.spawn([...launcher, '--model', 'fixture-128k', '-p', 'Reply OK.', '--output-format', 'json',
      '--system-prompt', 'Reply OK.', '--safe-mode', '--setting-sources', '', '--no-session-persistence',
      '--tools', '', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}'], {
      cwd: dir, env: { ...env, WISP_HOME: home, CLAUDE_CONFIG_DIR: join(dir, 'switch-picker'), CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' },
      stdout: 'pipe', stderr: 'pipe',
    });
    const timeout = setTimeout(() => warm.kill(), 30000);
    const [output, error, code] = await Promise.all([new Response(warm.stdout).text(), new Response(warm.stderr).text(), warm.exited]);
    clearTimeout(timeout); assert.equal(code, 0, error); assert.equal(JSON.parse(output).is_error, false);
  }
  const sdk = spawn(launcher[0], [...launcher.slice(1), ...(exact ? ['--exact-context'] : []), '--model', exact ? 'fixture-500k' : 'fixture-128k', '-p',
    '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose', '--system-prompt', 'Reply OK.', '--safe-mode',
    '--setting-sources', '', '--no-session-persistence', '--debug-file', join(dir, exact ? 'exact-debug.log' : 'picker-debug.log'), '--tools', '', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}'], {
    cwd: dir, env: { ...env, WISP_HOME: home, CLAUDE_CONFIG_DIR: join(dir, exact ? 'switch-exact' : 'switch-picker'), CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' },
    stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true,
  });
  const pending = new Map<string, (value: any) => void>();
  const exited = new Promise<void>(done => sdk.once('close', () => done()));
  const lines = createInterface({ input: sdk.stdout });
  sdk.stderr.resume();
  lines.on('line', line => {
    const message = JSON.parse(line);
    const id = message.type === 'control_response' ? message.response?.request_id : message.type === 'result' ? 'result' : undefined;
    if (id && pending.has(id)) { pending.get(id)!(message); pending.delete(id); }
  });
  const send = (id: string, message: unknown): Promise<any> => new Promise((done, reject) => {
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Native ${id} timed out`)); }, 15000);
    pending.set(id, value => { clearTimeout(timeout); done(value); }); sdk.stdin.write(JSON.stringify(message) + '\n');
  });
  try {
    const initialized = await send('init', { type: 'control_request', request_id: 'init', request: { subtype: 'initialize' } });
    const before = sent.length;
    if (exact) {
      const switched = await send('switch', { type: 'control_request', request_id: 'switch', request: { subtype: 'set_model', model: 'claude-opus-5' } });
      assert.equal(switched.response.subtype, 'error', 'A different model must be refused');
      assert.equal(sent.length, before, 'Refused switch must not spend an upstream request');
      const result = await send('result', { type: 'user', message: { role: 'user', content: 'Reply OK.' }, parent_tool_use_id: null });
      assert.equal(result.is_error, false);
      assert(Object.values(result.modelUsage).some((usage: any) => usage.contextWindow === 500000));
      console.log(JSON.stringify({ exact: true, safeSwitch: 'refused-before-upstream', retainedWindow: 500000, passed: true }));
    } else {
      const models = initialized.response.response.models.map((model: any) => model.value);
      for (const alias of Object.keys(limits)) assert(models.includes(`claude-wisp-${alias}`), `Missing alias ${alias}: ${JSON.stringify(models)}`);
      const first = await send('result', { type: 'user', message: { role: 'user', content: 'Reply OK.' }, parent_tool_use_id: null });
      assert.equal(first.is_error, false); assert.equal(sent.at(-1), 'fixture-128k');
      const switched = await send('switch', { type: 'control_request', request_id: 'switch', request: { subtype: 'set_model', model: 'claude-wisp-fixture-400k' } });
      assert.equal(switched.response.subtype, 'success');
      const second = await send('result', { type: 'user', message: { role: 'user', content: 'Reply OK again.' }, parent_tool_use_id: null });
      assert.equal(second.is_error, false); assert.equal(sent.at(-1), 'fixture-400k');
      console.log(JSON.stringify({ exact: false, aliases: Object.keys(limits), switchedTo: sent.at(-1), windows: Object.fromEntries(Object.entries(second.modelUsage).map(([model, usage]: [string, any]) => [model, usage.contextWindow])), passed: true }));
    }
  } catch (error) {
    const log = join(dir, exact ? 'exact-debug.log' : 'picker-debug.log');
    if (existsSync(log)) console.error(readFileSync(log, 'utf8').split('\n').filter(line => /gateway|discovery|model.*cache/i.test(line)).join('\n'));
    throw error;
  } finally { sdk.stdin.end(); await exited; lines.close(); }
  }
} finally {
  bridge.stop(); globalThis.fetch = originalFetch; rmSync(dir, { recursive: true, force: true });
}
