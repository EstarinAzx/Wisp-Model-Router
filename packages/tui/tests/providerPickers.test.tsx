import { expect, spyOn, test } from 'bun:test';
import { act } from 'react';
import { testRender } from '@opentui/react/test-utils';
import { PROVIDERS, type Provider } from '@wisp/core';
import { KeyPickScreen, OauthPickScreen, ProvidersScreen } from '../src/providerScreens';
import { RouteProviderScreen } from '../src/routingScreens';
import { activeProvider, home } from '../src/store';

const press = async (ui: Awaited<ReturnType<typeof testRender>>, ...keys: ('RETURN' | 'ARROW_DOWN' | 'ARROW_UP')[]) => {
  for (const key of keys) await act(async () => { await ui.mockInput.pressKeys([key]); });
};

test('provider pickers pin Custom and use display names while retaining provider IDs', async () => {
  const selected: string[] = [];
  const pick = (p: Provider) => selected.push(p.id);
  const config = spyOn(home, 'readConfig').mockReturnValue({ provider: 'xai' });
  const auth = spyOn(home, 'readAuth').mockReturnValue({});
  try {
    for (const { screen, labels } of [
      { screen: <ProvidersScreen onPick={pick} />, labels: ['› Custom', 'Anthropic', 'Antigravity', 'Cline', 'Codex', 'Grok (active)', 'Groq'] },
      { screen: <KeyPickScreen onPick={pick} />, labels: ['› Custom', 'Cline', 'Groq'] },
      { screen: <OauthPickScreen action="signin" onSignIn={pick} onSignOut={pick} />, labels: ['› Anthropic', 'Antigravity', 'Codex', 'Grok', 'Kimi'] },
    ]) {
      const ui = await testRender(screen, { width: 80, height: 24 });
      try {
        await ui.renderOnce();
        const frame = ui.captureCharFrame();
        let previous = -1;
        for (const label of labels) {
          const position = frame.indexOf(label);
          expect(position).toBeGreaterThan(previous);
          previous = position;
        }
        await press(ui, 'RETURN');
      } finally { await act(async () => { ui.renderer.destroy(); }); }
    }
    expect(selected).toEqual(['custom', 'custom', 'anthropic']);
    config.mockReturnValue({});
    expect(activeProvider().id).toBe('opencode-go');
    expect(PROVIDERS[0].id).toBe('opencode-go');
  } finally { auth.mockRestore(); config.mockRestore(); }
});

test('only a saved alias has action groups; arrows and Enter skip the headings', async () => {
  const alias = { name: 'fast', target: { providerId: 'xai', model: 'example' } };
  const config = spyOn(home, 'readConfig').mockReturnValue({ routing: { families: {}, aliases: [alias] } });
  const picked: string[] = [];
  const props = { cols: 72, onClear: () => picked.push('clear'), onRename: (name: string) => picked.push('rename ' + name),
    onPick: (p: Provider) => picked.push(p.id) };
  try {
    for (const name of ['fast', 'new']) {
      const ui = await testRender(<RouteProviderScreen {...props} row={{ kind: 'alias', name }} />, { width: 80, height: 24 });
      try {
        await ui.renderOnce();
        const frame = ui.captureCharFrame();
        if (name === 'fast') {
          expect(frame).toMatch(/Alias actions[\s\S]+› Rename alias[\s\S]+Remove alias[\s\S]+── Providers[\s\S]+Custom/);
          await press(ui, 'RETURN', 'ARROW_DOWN', 'RETURN', 'ARROW_DOWN', 'RETURN');
          for (let i = 0; i < 5; i++) await press(ui, 'ARROW_DOWN');
          await ui.renderOnce();
          expect(ui.captureCharFrame()).toContain('› Grok');
          await press(ui, 'RETURN');
        } else {
          expect(frame).not.toContain('Alias actions');
          expect(frame).not.toContain('Rename alias');
          expect(frame).not.toContain('Remove alias');
          expect(frame).toMatch(/› Custom[\s\S]+Anthropic[\s\S]+Antigravity/);
          await press(ui, 'RETURN');
        }
      } finally { await act(async () => { ui.renderer.destroy(); }); }
    }
    expect(picked).toEqual(['rename fast', 'clear', 'custom', 'xai', 'custom']);
  } finally { config.mockRestore(); }
});

test('family and Codex routes keep their clear action after the provider list on a short screen', async () => {
  const config = spyOn(home, 'readConfig').mockReturnValue({});
  const calls: string[] = [];
  try {
    for (const row of [{ kind: 'family', family: 'opus' }, { kind: 'codex-model', name: 'example' }] as const) {
      const ui = await testRender(<RouteProviderScreen row={row} cols={44} onClear={() => calls.push('clear')}
        onRename={() => calls.push('rename')} onPick={p => calls.push(p.id)} />, { width: 48, height: 16 });
      try {
        await ui.renderOnce();
        expect(ui.captureCharFrame()).toContain('› Custom');
        await press(ui, 'RETURN', 'ARROW_UP');
        await ui.renderOnce();
        expect(ui.captureCharFrame()).toContain('› Clear route');
        await press(ui, 'RETURN');
      } finally { await act(async () => { ui.renderer.destroy(); }); }
    }
    expect(calls).toEqual(['custom', 'clear', 'custom', 'clear']);
  } finally { config.mockRestore(); }
});
