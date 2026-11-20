// Read-only chapters for the Flight command palette. Keep command spellings in the registry.
import { useState } from 'react';
import { SLASH_COMMANDS } from '@wisp/core';
import { ChoiceList, Panel, wrapWords } from './widgets';
import { InfoScreen } from './infoScreens';
import { useTuiInk } from './theme';

const chapters = [
  { title: 'Your first route', paragraphs: [
    '1. In Wisp, open `/providers`. Pick a provider you can use. Choose Sign in for a subscription or Set API key for a keyed provider. Look for signed in, your account name, or key set in the provider list.',
    '2. Give a model a name. In Wisp, open `/routing` → Custom → Add alias. Enter first, choose the provider and model, then press Enter to apply. The alias list now shows first and its destination.',
    '3. Start the local connection. In Wisp, enter `/bridge`. Look for Bridge up and leave its host running.',
    '4. In a second terminal, with Claude Code installed, run:',
    '`claude-wisp --model first`',
    'Send a message there. It goes to the model you chose for first. In Wisp, `/show logs` lets you inspect the session and its route.',
    'To move around Wisp, type `/` to see commands. Use ↑ and ↓ to highlight one, Tab to fill it in, Enter to open, and Esc to go back.',
  ] },
  { title: 'Providers and credentials', paragraphs: [
    'A provider supplies the model. In Wisp, `/providers` shows names, provider IDs and connection status. Open a provider to see its sign-in or API key options.',
    'For API keys, open `/key` and pick the provider. Paste the key in the masked field and press Enter. For subscriptions, use `/signin`, choose your account provider and finish its browser or device sign-in. `/signout` disconnects a saved subscription.',
    'For Ollama (local), start Ollama with the model you have pulled on your machine. Select that provider and use its exact local model name.',
    'For your own OpenAI-compatible endpoint, choose the Custom provider. Set its base URL in the Wisp VS Code side panel with Custom selected, then set its key if required and use `/model custom` to enter the server’s model ID. In the shared Wisp config the URL field is customBaseUrl.',
    'Custom under `/routing` is the list of names you give models. An alias there can point to any provider.',
  ] },
  { title: 'Models and effort', paragraphs: [
    'In `/providers` open a provider and choose Use as Active Provider. Wisp marks it (active). It is the fallback when a request has no matching route.',
    'In Wisp, `/model` chooses a model for the Active Provider. To change another provider, include its ID, such as `/model codex`. Pick an offered model or enter the exact ID manually if needed. Refresh models queries the provider again.',
    'In Wisp, `/effort` shows the reasoning levels supported for the active setup. Pick a level offered for that model. A saved alias keeps its pinned model when you change the provider’s default model.',
  ] },
  { title: 'Routes and aliases', paragraphs: [
    'In Wisp, `/routing` maps a name requested by a client to a destination provider and model. The map has three sections.',
    'Claude Code groups requests by family, such as Sonnet or Haiku. Select a family to set its destination. Clearing its explicit route returns that family to the Active Provider. Bind Claude subscription models shows the latest stable IDs in the public catalog. Press Enter on Bind to apply all four. Your subscription determines access.',
    'Codex routes apply to an exact model name. Pick the client model you want to redirect, then choose its destination. An alias with the same name takes precedence.',
    'Custom holds aliases such as first. Select Add alias, enter a unique name, then pick a provider and model. Check the Proposed destination and press Enter to apply, or Esc to revise it.',
    'To edit a saved alias, select it. Choose a provider to change its destination, Rename alias to keep the destination under another name, or Remove alias to delete that name.',
  ] },
  { title: 'Bridge and clients', paragraphs: [
    'The Bridge connects a coding client to Wisp on this computer. In Wisp, `/bridge` starts it or shows the current host. The header shows Bridge up while a listener is running. Run one host at a time.',
    'Keep Wisp open. In a second terminal, run `claude-wisp --model first` for Claude Code, or `codex-wisp -m first` for the native Codex CLI. Install the chosen client separately. Replace first with your alias.',
    'The npm install provides both launcher commands. With the standalone binary, run `wisp claude-wisp --model first` or `wisp codex-wisp -m first` instead.',
    'To run a host without the interface, run `wisp serve` in a terminal. Stop that host with Ctrl+C. For a host running inside the Wisp TUI, `/bridge off` or quitting Wisp stops it. If another host owns the Bridge, use that host’s controls.',
    'In VS Code, the Wisp companion shares provider and routing settings. Open its Wisp panel to manage providers and select Wisp models in the editor’s model picker. The companion can also host the Bridge for external clients.',
  ] },
  { title: 'Tests, quota and logs', paragraphs: [
    'In Wisp, `/test first` sends a real sample prompt to your alias and displays the response. It can use provider quota or incur charges. A provider ID works too.',
    'In Wisp, `/quota` shows cached account usage. `/quota refresh` requests a fresh reading from supported accounts, or use `/quota refresh codex` for one account.',
    'In Wisp, `/show logs` lists recent sessions. Open a session to inspect its route and events. Esc returns to the session list. A missing session or blank quota reading can mean there has been no recent activity.',
  ] },
  { title: 'Troubleshooting', paragraphs: [
    'Sign-in or key error? Open `/providers` and check the exact provider behind your alias. Reconnect that provider if needed. Grok’s ID, for example, is xai.',
    'Model missing? In `/model` choose Refresh models or enter the provider’s exact model ID. Open `/routing` and confirm the alias points to the intended provider and model.',
    'Client cannot connect? In Wisp, check for Bridge up. If it is idle, `/bridge` starts it. Leave the host open and launch the Wisp wrapper from another terminal.',
    'Unexpected model? Check your alias, family or exact Codex route and the Active Provider. Start a new client session with the intended alias, then inspect `/show logs` for its route.',
    'To look up syntax in Wisp, open `/help`. For optional Desktop routing and the Antigravity client fallback, see Command reference in this guide before changing either setting.',
  ] },
  { title: 'Command reference', paragraphs: [
    'Run slash commands at the Wisp prompt. In this list, brackets mean optional and angle brackets mean required. Replace the placeholder with your own value.',
    ...SLASH_COMMANDS.map(({ name, args, description }) =>
      ['`/' + name + '`', ...(args ? ['`' + args + '`'] : []), '—', description].join(' ')),
  ] },
];

const topics = chapters.map(({ title }) => ({ name: title, description: '', value: title }));

// Wrap the visible text first so markup and color boundaries never affect terminal columns.
const guideRows = (paragraph: string, width: number, ink: ReturnType<typeof useTuiInk>) => {
  let plain = '';
  const runs = paragraph.split(/(`[^`]+`)/).filter(Boolean).map(part => {
    const code = part.startsWith('`');
    const text = code ? part.slice(1, -1) : part;
    const start = plain.length;
    plain += text;
    const hint = text.startsWith('[') || text.startsWith('<');
    return { start, end: plain.length, color: code ? (hint ? ink.note : ink.value) : ink.heading };
  });
  let offset = 0;
  return wrapWords(plain, width).map(line => {
    const start = plain.indexOf(line, offset);
    const end = start + line.length;
    offset = end;
    return runs.filter(run => run.start < end && run.end > start).map(run =>
      <span key={run.start} fg={run.color}>{plain.slice(Math.max(start, run.start), Math.min(end, run.end))}</span>);
  });
};

export const GuideScreen = ({ chapter, cols, maxRows, onRead }: {
  chapter?: number; cols: number; maxRows: number; onRead: (index: number) => void;
}) => {
  const ink = useTuiInk();
  const [selected, setSelected] = useState(0);
  if (chapter !== undefined) {
    const { title, paragraphs } = chapters[chapter];
    return <InfoScreen title={title} lines={paragraphs} cols={cols} maxRows={maxRows} escLabel="back"
      wrapParagraph={(text, width) => guideRows(text, width, ink)} />;
  }
  return <Panel title="Wisp guide">
    <ChoiceList options={topics} height={Math.min(topics.length, maxRows)} showDescription={false}
      selectedIndex={selected} onChange={setSelected} onSelect={onRead} />
    <text height={1} wrapMode="none" fg={ink.note} marginTop={1}>↑↓ select · Enter open · Esc back</text>
  </Panel>;
};
