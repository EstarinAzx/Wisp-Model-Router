import { describe, expect, it, vi } from 'vitest';
import OpenAI from 'openai';
import { DesktopUpstreamError, desktopUpstreamFailure } from '../src/desktopUpstream';
import { AnthropicAuth } from '../src/anthropicAuth';

describe('signed upstream error trust boundary', () => {
  it('preserves a local expired Anthropic credential failure as non-retryable 401', async () => {
    vi.stubGlobal('fetch', async () => new Response('{}', { status: 400 }));
    try {
      const auth = new AnthropicAuth({ read: () => ({ accessToken: 'expired', refreshToken: 'refresh', expiresAt: 1 }),
        write: () => { throw new Error('Unexpected credential write'); } }, async () => true, () => {});
      let error: unknown;
      try { await auth.current(); } catch (caught) { error = caught; }
      expect(desktopUpstreamFailure(error)).toMatchObject({ status: 401, code: 'authentication_error', retryable: false });
    } finally { vi.unstubAllGlobals(); }
  });
  it.each([NaN, Infinity, 399, 600, 400.5, '401'])('rejects invalid status metadata %s', status => {
    const result = desktopUpstreamFailure(new DesktopUpstreamError(status as number, 'PRIVATE_CODE'));
    expect(result.status).toBe(502); expect(result.retryable).toBe(false);
    expect(JSON.stringify(result)).not.toContain('PRIVATE');
  });
  it('does not promote plain objects or free text into status/code', () => {
    for (const error of [Object.assign(new Error('API error 401 invalid_api_key fetch failed'), { status: 401, code: 'invalid_api_key' }), { status: 401, code: 'invalid_api_key' }, new Error('fetch failed')]) {
      expect(desktopUpstreamFailure(error)).toEqual({ status: 502, code: 'upstream_error', message: 'Desktop provider request failed (upstream_error)', retryable: false });
    }
  });
  it('recognizes SDK status and only allowlisted structured codes', () => {
    const sdk = new OpenAI.APIError(401, { code: 'invalid_api_key', message: 'PRIVATE_BODY API error 503' }, 'PRIVATE_MESSAGE', undefined);
    expect(desktopUpstreamFailure(sdk)).toEqual({ status: 401, code: 'invalid_api_key', message: 'Desktop provider rejected the request (HTTP 401; invalid_api_key)', retryable: false });
    expect(desktopUpstreamFailure(new DesktopUpstreamError(429, 'insufficient_quota')).retryable).toBe(false);
  });
  it('keeps network errors distinct from typed stream failures', () => {
    expect(desktopUpstreamFailure(new TypeError('fetch failed')).retryable).toBe(true);
    expect(desktopUpstreamFailure(new DesktopUpstreamError(undefined, 'stream_incomplete'))).toMatchObject({ status: 502, code: 'stream_incomplete', retryable: false });
  });
});
