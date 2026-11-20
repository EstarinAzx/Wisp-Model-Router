// ---------------- infoScreens.tsx — the info Screens: /bridge facts + /help list + /show-log tail ---------------- //

// Session screens poll the shared core store, including external hosts.

import { useEffect, useState } from 'react';
import { SLASH_COMMANDS, listLogSessions, readSessionLog, formatSessionLog } from '@wisp/core';
import { useKeyboard, useTerminalDimensions } from '@opentui/react';
import { FOREGROUND } from './theme';
import { ChoiceList, Panel, wrapWords } from './widgets';
import { sessionLabel, sessionDetail } from './bridgeLog';

// Shared command output: hand-wrap before scrolling so narrow terminals retain every line.
export const InfoScreen = ({ title, lines, cols, maxRows, pending }: { title: string; lines: string[]; cols: number; maxRows: number; pending?: boolean }) => {
  // Leave room for the native scrollbar.
  const wrapped = lines.flatMap((line, i) => [...(i ? [''] : []), ...wrapWords(line, Math.max(cols - 1, 1))]);
  return (
    <Panel title={title}>
      <scrollbox focused scrollY height={Math.min(wrapped.length, Math.max(maxRows, 1))}>
        {wrapped.map((line, i) => <text fg={FOREGROUND} key={i} wrapMode="none" height={1} flexShrink={0}>{line}</text>)}
      </scrollbox>
      <text wrapMode="none" fg={FOREGROUND} marginTop={1}>↑/↓ scroll · Esc {pending ? 'cancels' : 'closes'}</text>
    </Panel>
  );
};

// ----------------------------------------- /bridge ----------------------------------------- //

// The Bridge info panel — connection facts for the session's own listener.
export const BridgeScreen = ({ address, secret, cols }: { address: string; secret: string; cols: number }) => {
  const [setup, setSetup] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const { height } = useTerminalDimensions();
  useKeyboard(key => {
    if (key.ctrl || key.meta) return;
    if (key.name === 's') { setSetup(!setup); setRevealed(false); }
    if (!setup && key.name === 'r') setRevealed(!revealed);
  });
  const lines = setup ? [
    'Launch       claude-wisp [args…]',
    'Wisp Slot    /plugin marketplace add EstarinAzx/Wisp-Router',
    'Wisp Slot shows Claude Code which families use your Routing map.',
    'Advisor      claude-wisp enables /advisor automatically. For manual setup, set CLAUDE_CODE_ENABLE_EXPERIMENTAL_ADVISOR_TOOL=1.',
    'Stop         /bridge off',
  ] : [
    'OpenAI         ' + address + '/v1',
    'Anthropic      ' + address,
    'Access secret  ' + (revealed ? secret : '••••••'),
  ];
  const rows = lines.flatMap(line => line.length < cols ? [line] : wrapWords(line, Math.max(1, cols - 1)));
  return <Panel title={setup ? 'Bridge / Client setup' : 'Bridge'}>
    <scrollbox focused scrollY height={Math.max(1, Math.min(rows.length, height - 8))}>
      {rows.map((row, i) => <text key={i} height={1} wrapMode="none" fg={FOREGROUND}>{row}</text>)}
    </scrollbox>
    <text fg={FOREGROUND} marginTop={1}>{setup ? 'S back · ↑↓ scroll · Esc close' : `R ${revealed ? 'hide' : 'reveal'} · S setup · Esc close`}</text>
  </Panel>;
};

// ----------------------------------------- /show-log ----------------------------------------- //

// The Bridge log tail (#122) — scrollbox stickyScroll gives auto-follow with scroll-to-pause
// and a mouse-draggable native scrollbar; no SELECT_MOUSE needed (that's the <select> shim).
// Long lines are hand-wrapped (opentui wrapMode overlays siblings) so model ids don't clip.
export const SessionListScreen = ({ onSelect }: { onSelect: (id: string) => void }) => {
  const [sessions, setSessions] = useState(() => listLogSessions());
  useEffect(() => { const timer = setInterval(() => setSessions(listLogSessions()), 1000); return () => clearInterval(timer); }, []);
  return <Panel title="Chat sessions">
    {sessions.length > 0 && <text fg={FOREGROUND}>Last 30 minutes · All hosts</text>}
    {sessions.length ? <ChoiceList
      height={Math.min(sessions.length * 2, 12)}
      options={sessions.map(session => ({ name: sessionLabel(session), description: sessionDetail(session), value: session.id }))}
      onSelect={(_, option) => { if (option?.value) onSelect(String(option.value)); }} />
      : <text wrapMode="none" fg={FOREGROUND}>No sessions in the last 30 minutes.</text>}
    <text wrapMode="none" fg={FOREGROUND}>{sessions.length ? 'Enter open · Esc back' : 'Esc back'}</text>
  </Panel>;
};

export const LogScreen = ({ id, cols }: { id: string; cols: number }) => {
  const [entries, setEntries] = useState(() => readSessionLog(id));
  useEffect(() => { setEntries(readSessionLog(id)); const timer = setInterval(() => setEntries(readSessionLog(id)), 500); return () => clearInterval(timer); }, [id]);
  const lines = entries.filter(entry => entry.event !== 'heartbeat').slice(-200);
  // Leave one cell for the native scroll indicator.
  const width = Math.max(cols - 1, 1);
  return (
    <Panel title="Session log">
      <text fg={FOREGROUND} wrapMode="none" flexShrink={0}>
        {id}
      </text>
      <scrollbox height={16} marginTop={1} stickyScroll stickyStart="bottom" scrollY>
        {lines.length === 0
          ? <text wrapMode="none" fg={FOREGROUND}>Session unavailable or pruned.</text>
          : lines.flatMap(entry => {
              const isRoute = entry.event === 'route';
              return wrapWords(formatSessionLog(entry), width).map((w, j) => (
                <text key={`${entry.sequence}-${j}`} wrapMode="none" flexShrink={0} fg={FOREGROUND}>{isRoute ? <strong>{w}</strong> : w}</text>
              ));
            })}
      </scrollbox>
      <text wrapMode="none" fg={FOREGROUND} marginTop={1}>Latest 200 events · Esc returns · scroll up pauses follow, bottom resumes</text>
    </Panel>
  );
};

// ----------------------------------------- /help ----------------------------------------- //

// The /help panel — the command list, closed by Enter or Esc (the shell routes Esc).
export const HelpScreen = ({ onDone }: { onDone: () => void }) => (
  <Panel title="Commands">
    {/* rendered FROM the shared registry (#82) — the palette's autocomplete and this list
        can never disagree. A select, not plain rows: 13+ commands clip a 24-row terminal,
        and the select brings the same height cap + scroll the other pickers use. Enter
        only closes — firing (or toggling!) a command from a help list would surprise. */}
    <ChoiceList
      height={Math.min(SLASH_COMMANDS.length * 2, 12)}
      options={SLASH_COMMANDS.map((c) => ({ name: `/${c.name}${c.args ? ` ${c.args}` : ''}`, description: c.description, value: c.name }))}
      onSelect={() => onDone()}
    />
    <text wrapMode="none" fg={FOREGROUND} marginTop={1}>Enter or Esc closes.</text>
  </Panel>
);
