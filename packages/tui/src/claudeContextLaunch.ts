// Child-only Claude launch configuration; exact context is opt-in. Native permissions and unrelated options remain native.
import { readFileSync } from 'fs';
import { buildClaudeLaunch, CLAUDE_CONTEXT_HEADER, CLAUDE_CONTEXT_PREFIX, readClaudeContext, type ClaudeContextProfile } from '@wisp/core';

type Settings = Record<string, any>;
export type ClaudeContextArgs = { model?: string; exactContext: boolean; resume: boolean; args: string[]; settings: Settings };
const object = (value: unknown): value is Settings => !!value && typeof value === 'object' && !Array.isArray(value);
const values = new Set(['--system-prompt', '--system-prompt-file', '--append-system-prompt', '--append-system-prompt-file',
  '--permission-mode', '--permission-prompt-tool', '--output-format', '--input-format', '--json-schema', '--effort',
  '--agent', '--agents', '--session-id', '--max-turns', '--max-budget-usd', '--mcp-config', '--tools', '--allowedTools',
  '--allowed-tools', '--disallowedTools', '--disallowed-tools', '--plugin-dir', '--plugin-url', '--add-dir', '--setting-sources',
  '--fallback-model', '--betas', '--debug-file', '--name', '-n', '--remote-control-session-name-prefix']);

export const parseClaudeContextArgs = (args: readonly string[]): ClaudeContextArgs => {
  const result: ClaudeContextArgs = { exactContext: false, resume: false, args: [], settings: {} };
  let fallback = false, settingsSeen = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--') { result.args.push(...args.slice(i)); break; }
    if (arg === '--exact-context') { result.exactContext = true; continue; }
    if (arg.startsWith('--exact-context=')) throw new Error('Use --exact-context without a value.');
    if (arg === '--model' || arg.startsWith('--model=')) {
      const model = arg === '--model' ? args[++i] : arg.slice(8);
      if (!model?.trim() || model.startsWith('--') || result.model !== undefined) throw new Error('Supply one --model <Wisp alias or Provider>.');
      result.model = model; continue;
    }
    if (arg === '--settings' || arg.startsWith('--settings=')) {
      const value = arg === '--settings' ? args[++i] : arg.slice(11);
      if (!value || settingsSeen) throw new Error('Supply at most one --settings JSON object or file.');
      settingsSeen = true;
      try { result.settings = JSON.parse(value.trimStart().startsWith('{') ? value : readFileSync(value, 'utf8')); }
      catch { throw new Error('Could not read --settings as a JSON object; no settings were changed.'); }
      if (!object(result.settings)) throw new Error('--settings must contain a JSON object.');
      continue;
    }
    if (/^--fallback-model(?:=|$)/.test(arg)) fallback = true;
    if (/^(?:--resume|--continue)(?:=|$)/.test(arg) || arg === '-r' || arg === '-c') result.resume = true;
    result.args.push(arg);
    if (values.has(arg)) {
      if (args[i + 1] === undefined) throw new Error(`Missing value for ${arg}.`);
      result.args.push(args[++i]);
    }
  }
  if (result.exactContext && fallback) throw new Error('A fallback needs its own context budget. Relaunch claude-wisp --exact-context with --model instead.');
  if (result.exactContext && result.resume && !result.model) throw new Error('Resume with an explicit --model <Wisp alias or Provider> so the context budget matches the selected target.');
  return result;
};

export const supportsClaudeContext = (version: string): boolean => {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:\s|$)/.exec(version.trim());
  if (!match) return false;
  const [major, minor, patch] = match.slice(1).map(Number);
  return major > 2 || (major === 2 && (minor > 1 || (minor === 1 && patch >= 322)));
};

export const resolveClaudeContextSelection = (model: string | undefined, env: NodeJS.ProcessEnv, secret: string): string | undefined => {
  if (!model?.startsWith(CLAUDE_CONTEXT_PREFIX)) return model;
  const line = (env.ANTHROPIC_CUSTOM_HEADERS ?? '').split(/\r?\n/).find(value => value.slice(0, value.indexOf(':')).trim().toLowerCase() === CLAUDE_CONTEXT_HEADER);
  if (line) {
    const inherited = readClaudeContext(line.slice(line.indexOf(':') + 1).trim(), secret);
    if (inherited.id === model) return inherited.route;
  }
  throw new Error('This generated model belongs to another launch. Use --model with the original Wisp alias.');
};

export const buildClaudeContextLaunch = (port: number, secret: string, profile: ClaudeContextProfile | undefined, token: string | undefined,
  parsed: ClaudeContextArgs, inherited: NodeJS.ProcessEnv): { env: NodeJS.ProcessEnv; args: string[]; settings: Settings } => {
  if (!Number.isInteger(port) || port < 1 || port > 65535 || !secret.trim()) throw new Error('Invalid Bridge port or secret.');
  if (profile) {
    const verified = readClaudeContext(token, secret);
    if (JSON.stringify(verified) !== JSON.stringify(profile)) throw new Error('Claude context profile does not match its token.');
  } else if (parsed.exactContext) throw new Error('Exact context requires a signed launch profile.');
  const settings = { ...parsed.settings };
  if (profile && settings.autoCompactEnabled === false) throw new Error('Exact context mode requires automatic compaction; remove autoCompactEnabled: false.');
  if (settings.env !== undefined && !object(settings.env)) throw new Error('Settings env must be an object.');
  const explicitEnv = settings.env ?? {};
  // Reject active overrides in either source: different casing must not hide an inherited flag on POSIX.
  const suppliedEnv = [...Object.entries(inherited), ...Object.entries(explicitEnv)].map(([key, value]) => [key.toUpperCase(), value] as const);
  for (const [key, value] of suppliedEnv) {
    if (profile && ['DISABLE_COMPACT', 'DISABLE_AUTO_COMPACT', 'CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT'].includes(key)
      && value !== undefined && !['0', 'false', ''].includes(String(value).toLowerCase())) throw new Error(`Exact context mode conflicts with ${key}; leave automatic compaction enabled.`);
    if ((key.startsWith('CLAUDE_CODE_USE_') || key === 'ANTHROPIC_UNIX_SOCKET') && value && !['0', 'false'].includes(String(value).toLowerCase())) {
      throw new Error(`Provider override ${key} conflicts with the Wisp Bridge.`);
    }
  }
  const base = buildClaudeLaunch(port, secret, []);
  // Empty overrides saved settings too; deleting the token here would let Claude restore it.
  const protectedEnv: Record<string, string> = { ...base.env, ANTHROPIC_AUTH_TOKEN: '',
    ANTHROPIC_MODEL: profile?.id ?? parsed.model ?? '', WISP_CLAUDE_CONTEXT_PROFILE: profile ? JSON.stringify(profile) : '' };
  if (profile) {
    protectedEnv.CLAUDE_CODE_MAX_CONTEXT_TOKENS = String(profile.contextWindow);
    protectedEnv.CLAUDE_CODE_DISABLE_1M_CONTEXT = '1';
  } else if (Object.entries(inherited).some(([key, value]) => key.toUpperCase() === 'WISP_CLAUDE_CONTEXT_PROFILE' && value)) {
    // An ordinary nested launch must not inherit the previous target's numeric budget.
    protectedEnv.CLAUDE_CODE_MAX_CONTEXT_TOKENS = '';
    protectedEnv.CLAUDE_CODE_DISABLE_1M_CONTEXT = '';
  }
  for (const [key, value] of Object.entries(explicitEnv)) {
    if (Object.hasOwn(protectedEnv, key.toUpperCase()) && String(value) !== protectedEnv[key.toUpperCase()]) throw new Error(`--settings env.${key} conflicts with the selected Wisp context profile.`);
  }
  const lines: string[] = [];
  for (const line of String(explicitEnv.ANTHROPIC_CUSTOM_HEADERS ?? inherited.ANTHROPIC_CUSTOM_HEADERS ?? '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const split = line.indexOf(':');
    const key = line.slice(0, split).trim().toLowerCase();
    if (split <= 0 || ['authorization', 'x-api-key', 'host'].includes(key)) throw new Error('Custom headers conflict with Wisp transport authentication.');
    if (key === CLAUDE_CONTEXT_HEADER) continue; // A nested relaunch replaces only its parent's profile.
    lines.push(line);
  }
  protectedEnv.ANTHROPIC_CUSTOM_HEADERS = [...lines, ...(profile ? [`${CLAUDE_CONTEXT_HEADER}: ${token}`] : [])].join('\n');
  const bypass = (value?: string) => [value, '127.0.0.1', 'localhost', '::1'].filter(Boolean).join(',');
  const preserved = Object.fromEntries(Object.entries(inherited).filter(([key]) => !Object.hasOwn(protectedEnv, key.toUpperCase())));
  const env = { ...preserved, ...protectedEnv, NO_PROXY: bypass(inherited.NO_PROXY), no_proxy: bypass(inherited.no_proxy) };
  // Flag settings win over saved env without changing the user's files. The launcher writes this to a private temporary file.
  settings.env = { ...Object.fromEntries(Object.entries(explicitEnv).filter(([key]) => !Object.hasOwn(protectedEnv, key.toUpperCase()))), ...protectedEnv };
  const model = profile?.id ?? parsed.model;
  if (model) settings.model = model;
  if (profile) {
    settings.autoCompactEnabled = true;
    settings.availableModels = [profile.id];
    settings.enforceAvailableModels = true;
    settings.modelPicker = { replaceBuiltInOptions: true, options: [{ model: profile.id, label: profile.route,
      description: `${profile.contextWindow} context tokens; change target by relaunching claude-wisp.` }] };
  }
  return { env, args: [...(model ? ['--model', model] : []), ...parsed.args], settings };
};
