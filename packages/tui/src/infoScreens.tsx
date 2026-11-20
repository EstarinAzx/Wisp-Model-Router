// ---------------- infoScreens.tsx — the info Screens: /bridge facts + /help list + /show-log tail ---------------- //

// Session screens poll the shared core store, including external hosts.

import { useEffect, useState, type ReactNode } from 'react';
import { SLASH_COMMANDS, listLogSessions, readSessionLog, formatSessionLog } from '@wisp/core';
import { useKeyboard, useTerminalDimensions } from '@opentui/react';
import { ACCENT, FOREGROUND, useTuiInk, type tuiInk } from './theme';
import { ChoiceList, Panel, wrapWords } from './widgets';
import { sessionLabel, sessionDetail } from './bridgeLog';

// Shared command output: hand-wrap before scrolling so narrow terminals retain every line.
export const InfoScreen = ({ title, lines, cols, maxRows, pending }: { title: string; lines: string[]; cols: number; maxRows: number; pending?: boolean }) => {
  const ink = useTuiInk();
  // Leave room for the native scrollbar.
  const wrapped = lines.flatMap((line, i) => [...(i ? [''] : []), ...wrapWords(line, Math.max(cols - 1, 1))]);
  return (
    <Panel title={title}>
      <scrollbox focused scrollY height={Math.min(wrapped.length, Math.max(maxRows, 1))}>
        {wrapped.map((line, i) => <text fg={pending ? ink.live : ink.value} key={i} wrapMode="none" height={1} flexShrink={0}>{line}</text>)}
      </scrollbox>
      <text wrapMode="none" fg={ink.note} marginTop={1}>↑/↓ scroll · Esc {pending ? 'cancels' : 'closes'}</text>
    </Panel>
  );
};

// ----------------------------------------- /bridge ----------------------------------------- //

// The Bridge info panel — connection facts for the session's own listener.
export const BridgeScreen = ({ address, secret, cols, ink }: {
  address: string; secret: string; cols: number; ink: typeof tuiInk.dark;
}) => {
  const [page, setPage] = useState<'endpoints' | 'setup' | 'advisor'>('endpoints');
  const [revealed, setRevealed] = useState(false);
  const { height } = useTerminalDimensions();
  useKeyboard(key => {
    if (key.ctrl || key.meta) return;
    if (key.name === 's') {
      setPage(page === 'endpoints' ? 'setup' : 'endpoints');
      setRevealed(false);
    }
    if (key.name === 'a' && page !== 'endpoints') setPage(page === 'setup' ? 'advisor' : 'setup');
    if (key.name === 'r' && page === 'endpoints') setRevealed(!revealed);
  });

  const rows: ReactNode[] = [];
  const width = Math.max(1, cols - 1);
  const add = (text: string, role: 'heading' | 'value' | 'note') => {
    if (role === 'heading' && rows.length) rows.push('');
    const indent = role === 'heading' ? '' : '  ';
    for (const line of wrapWords(text, width - indent.length)) {
      rows.push(<span fg={ink[role]}>{indent}{role === 'heading' ? <strong>{line}</strong> : line}</span>);
    }
  };
  let title = 'Bridge';
  let keys: string;
  if (page === 'setup') {
    title = 'Bridge / Client setup';
    add('Launch Claude Code', 'heading');
    add('claude-wisp [args…]', 'value');
    add('Install Wisp Slot in Claude Code', 'heading');
    add('/plugin marketplace add EstarinAzx/Wisp-Router', 'value');
    add('Shows which families use your routing map.', 'note');
    add('Advisor', 'heading');
    add('Enabled automatically by claude-wisp.', 'note');
    add('Stop the Bridge', 'heading');
    add('/bridge off', 'value');
    keys = 'A manual Advisor setup · S back · Esc close';
  } else if (page === 'advisor') {
    title = 'Bridge / Advisor';
    add('Manual Advisor setup', 'heading');
    add('Set this when launching Claude Code manually.', 'note');
    add('CLAUDE_CODE_ENABLE_EXPERIMENTAL_ADVISOR_TOOL=1', 'value');
    keys = 'A back to setup · S endpoints · Esc close';
  } else {
    const endpoints = [['├─ OpenAI', address + '/v1'], ['└─ Anthropic', address],
      ['Access secret', revealed ? secret : '••••••']];
    for (const [label, value] of endpoints) {
      if (label === 'Access secret') rows.push('');
      if (16 + value.length <= width) {
        rows.push(<><span fg={ink.note}>{label.padEnd(16)}</span><span fg={ink.value}>{value}</span></>);
      } else {
        rows.push(<span fg={ink.note}>{label}</span>);
        add(value, 'value');
      }
    }
    keys = (revealed ? 'R hide' : 'R reveal') + ' · S setup · Esc close';
  }
  const available = Math.max(1, height - 10);
  const scroll = rows.length > available - wrapWords(keys, cols).length + 1;
  const hints = wrapWords((scroll ? '↑↓ scroll · ' : '') + keys, cols);
  return <Panel title={title}>
    <scrollbox key={page} focused scrollY height={Math.min(rows.length, Math.max(1, available - hints.length + 1))}
      scrollbarOptions={{ trackOptions: { backgroundColor: 'transparent', foregroundColor: ACCENT } }}>
      {rows.map((row, i) => <text key={i} height={1} wrapMode="none" fg={FOREGROUND}>{row}</text>)}
    </scrollbox>
    <box marginTop={1}>{hints.map((hint, i) => <text key={i} height={1} fg={ink.note}>{hint}</text>)}</box>
  </Panel>;
};

// ----------------------------------------- /show-log ----------------------------------------- //

// The Bridge log tail (#122) — scrollbox stickyScroll gives auto-follow with scroll-to-pause
// and a mouse-draggable native scrollbar; no SELECT_MOUSE needed (that's the <select> shim).
// Long lines are hand-wrapped (opentui wrapMode overlays siblings) so model ids don't clip.
export const SessionListScreen = ({ onSelect }: { onSelect: (id: string) => void }) => {
  const ink = useTuiInk();
  const [sessions, setSessions] = useState(() => listLogSessions());
  useEffect(() => { const timer = setInterval(() => setSessions(listLogSessions()), 1000); return () => clearInterval(timer); }, []);
  return <Panel title="Chat sessions">
    {sessions.length > 0 && <text fg={ink.note}>Last 30 minutes · All hosts</text>}
    {sessions.length ? <ChoiceList
      height={Math.min(sessions.length * 2, 12)}
      options={sessions.map(session => ({ name: sessionLabel(session), description: sessionDetail(session), value: session.id }))}
      onSelect={(_, option) => { if (option?.value) onSelect(String(option.value)); }} />
      : <text wrapMode="none" fg={ink.note}>No sessions in the last 30 minutes.</text>}
    <text wrapMode="none" fg={ink.note}>{sessions.length ? 'Enter open · Esc back' : 'Esc back'}</text>
  </Panel>;
};

export const LogScreen = ({ id, cols }: { id: string; cols: number }) => {
  const ink = useTuiInk();
  const [entries, setEntries] = useState(() => readSessionLog(id));
  useEffect(() => { setEntries(readSessionLog(id)); const timer = setInterval(() => setEntries(readSessionLog(id)), 500); return () => clearInterval(timer); }, [id]);
  const lines = entries.filter(entry => entry.event !== 'heartbeat').slice(-200);
  // Leave one cell for the native scroll indicator.
  const width = Math.max(cols - 1, 1);
  return (
    <Panel title="Session log">
      <text fg={ink.value} wrapMode="none" flexShrink={0}>
        {id}
      </text>
      <scrollbox height={16} marginTop={1} stickyScroll stickyStart="bottom" scrollY>
        {lines.length === 0
          ? <text wrapMode="none" fg={ink.note}>Session unavailable or pruned.</text>
          : lines.flatMap(entry => {
              const isRoute = entry.event === 'route';
              return wrapWords(formatSessionLog(entry), width).map((w, j) => (
                <text key={`${entry.sequence}-${j}`} wrapMode="none" flexShrink={0} fg={isRoute ? ink.value : ink.heading}>{isRoute ? <strong>{w}</strong> : w}</text>
              ));
            })}
      </scrollbox>
      <text wrapMode="none" fg={ink.note} marginTop={1}>Latest 200 events · Esc returns · scroll up pauses follow, bottom resumes</text>
    </Panel>
  );
};

// ----------------------------------------- /help ----------------------------------------- //

// The /help panel — the command list, closed by Enter or Esc (the shell routes Esc).
export const HelpScreen = ({ onDone }: { onDone: () => void }) => {
  const ink = useTuiInk();
  return <Panel title="Commands">
    {/* rendered FROM the shared registry (#82) — the palette's autocomplete and this list
        can never disagree. A select, not plain rows: 13+ commands clip a 24-row terminal,
        and the select brings the same height cap + scroll the other pickers use. Enter
        only closes — firing (or toggling!) a command from a help list would surprise. */}
    <ChoiceList
      height={Math.min(SLASH_COMMANDS.length * 2, 12)}
      options={SLASH_COMMANDS.map((c) => ({ name: `/${c.name}${c.args ? ` ${c.args}` : ''}`, description: c.description, value: c.name }))}
      onSelect={() => onDone()}
    />
    <text wrapMode="none" fg={ink.note} marginTop={1}>Enter or Esc closes.</text>
  </Panel>;
};
