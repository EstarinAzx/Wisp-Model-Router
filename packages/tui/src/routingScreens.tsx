// ---------------- routingScreens.tsx — the /routing flow: overview, sections, alias naming, row picks ---------------- //

/*
 * Depends on:
 *   - @wisp/core: PROVIDERS + FAMILY_KEYS + the pure routing-map read/edit helpers.
 *   - ./store: the shared ~/.wisp handle — the routing map lives in config.
 *   - ./modes: RouteRow — which map row a picker chain is editing.
 *   - ./theme: input and text colors — the shared look.
 *   - ./widgets: wrapWords + WrapSelect + onSubmitText — the wrapped-select Screens.
 *
 * Data shapes:
 *   - Screens are pure functions of their Mode payload fields + navigation callbacks — same
 *     rules as providerScreens (#117): no Screen owns navigation or shell state. The shell
 *     keeps the route action starters (applyRoute/clearRow/startRouteModel/bindClaudeFamilies)
 *     and Esc step-back routing, importing the row helpers it needs from here.
 *
 * Extracted from app.tsx with #118: the eight routing-flow Screens plus the routing-row
 * helpers only this flow uses (routingMap, rowLabel, sectionOf, CLAUDE_FAMILY_MODELS are
 * shared with the shell's starters).
 */

import {
  PROVIDERS, FAMILY_KEYS, EMPTY_ROUTING_MAP, withAliasRenamed,
  type Provider, type RoutingMap, type FamilyKey, type Target,
} from '@wisp/core';
import { useTerminalDimensions } from '@opentui/react';
import { ArtRows, flightWidth } from './flight';
import { routeArt } from './flightArt';
import { home } from './store';
import type { RouteRow, RoutingSection } from './modes';
import { useEffect, useState } from 'react';
import { codexRoutingRows, loadCodexRoutingCatalog, type CodexRoutingCatalog } from './codexRouting';
import { commandFrameFits, useTuiInk } from './theme';
import { ChoiceList, Panel, wrapWords, WrapSelect, type WrapOption, onSubmitText, useInputColors } from './widgets';

// ----------------------------------------- Row helpers ----------------------------------------- //

export const routingMap = (): RoutingMap => home.readConfig().routing ?? EMPTY_ROUTING_MAP;

export const rowLabel = (row: RouteRow): string => (row.kind === 'family' ? row.family : row.name);

const rowTarget = (map: RoutingMap, row: RouteRow): Target | undefined =>
  row.kind === 'family' ? map.families[row.family] : row.kind === 'codex-model'
    ? (Object.hasOwn(map.codexModels ?? {}, row.name) ? map.codexModels![row.name] : undefined)
    : map.aliases.find((a) => a.name === row.name)?.target;

// The /routing sub-screens step back one level on Esc/apply — to the SECTION they came from
// (#79). Origin is derivable (family rows → Claude Code section, alias screens → Custom).
export const sectionOf = (row: RouteRow): RoutingSection => row.kind === 'family' ? 'families' : row.kind === 'codex-model' ? 'codex' : 'aliases';

// The one-tap "bind Claude subscription models" mapping: each Family route's natural Claude.ai
// model. TUI-local data — promote to core if the side panel ever grows the same button.
// STALE-BY-DESIGN: a hardcoded table the live picker cannot correct, so a new Claude release makes the
// one-tap bind a silent DOWNGRADE (it overwrote fable with claude-fable-5 after claude-fable-5-1 shipped
// 2026-09-01). Re-check alongside CLAUDE_CODE_VERSION whenever a family gains a release — those two pins
// go stale on the same event.
export const CLAUDE_FAMILY_MODELS: Record<FamilyKey, string> = {
  opus: 'claude-opus-5',
  sonnet: 'claude-sonnet-5',
  haiku: 'claude-haiku-4-5',
  fable: 'claude-fable-5-1',
};

// ----------------------------------------- Screens ----------------------------------------- //

// The /routing overview — two sections: Claude Code's Family routes, and the named Aliases.
const traces = [routeArt(0), routeArt(1), routeArt(2)];
export const RoutingScreen = ({ cols, onPick }: {
  cols: number;
  onPick: (section: RoutingSection) => void;
}) => {
  const [selected, setSelected] = useState(0);
  const { height } = useTerminalDimensions();
  const illustrated = cols >= 62 && height >= 24;
  const sections: { name: string; description: string; value: RoutingSection }[] = [
    { name: 'Claude Code', description: FAMILY_KEYS.join(' / '), value: 'families' },
    { name: 'Codex', description: 'Exact model routes', value: 'codex' },
    { name: 'Custom', description: `Aliases · ${routingMap().aliases.length}`, value: 'aliases' },
  ];
  return <Panel title="Routing map">
    <box flexDirection="row" alignItems="center">
      {illustrated && <box width={21} marginRight={2}><ArtRows rows={traces[selected]} /></box>}
      <box flexGrow={1}>
        <ChoiceList height={6} options={sections} selectedIndex={selected}
          onChange={setSelected} onSelect={index => onPick(sections[index].value)} />
      </box>
    </box>
  </Panel>;
};

// The TUI ships on Bun. Count terminal cells so wide alias names keep their columns.
declare const Bun: {
  stringWidth(text: string): number;
  wrapAnsi(text: string, columns: number, options: { hard: boolean }): string;
};

// One section's rows — Family routes with the one-tap bind, or Aliases with add.
export const RoutingSectionScreen = ({ section, cols, onAddAlias, onBind, onPickRow }: {
  section: RoutingSection;
  cols: number;
  onAddAlias: () => void;
  onBind: () => void;
  onPickRow: (row: RouteRow) => void;
}) => {
  const ink = useTuiInk();
  const [catalog, setCatalog] = useState<CodexRoutingCatalog>({ models: [], error: 'Discovering native Codex models…' });
  useEffect(() => {
    if (section !== 'codex') return;
    let active = true;
    void loadCodexRoutingCatalog().then(result => { if (active) setCatalog(result); });
    return () => { active = false; };
  }, [section]);
  const map = routingMap();
  const sourceLabel = section === 'families' ? 'Family' : section === 'codex' ? 'Codex model' : 'Alias';
  const wide = cols >= 46;
  const sourceWidth = section === 'families' ? 10 : Math.min(22, Math.floor(cols / 3));
  const destWidth = Math.max(1, cols - sourceWidth - 5);
  const option = (name: string, target: string, value: string): WrapOption => {
    const wrap = (text: string, width: number): string[] => Bun.wrapAnsi(text, Math.max(1, width), { hard: true }).split('\n');
    const source = wrap(name, wide ? sourceWidth : cols - 2);
    const dest = wrap(target, wide ? destWidth : cols - 4);
    const lines = wide ? Array.from({ length: Math.max(source.length, dest.length) }, (_, i) => {
      const label = source[i] ?? '';
      return { source: label + ' '.repeat(Math.max(0, sourceWidth - Bun.stringWidth(label))),
        connector: i === 0 ? ' → ' : '   ', destination: dest[i] };
    }) : [...source.map(source => ({ source })), ...dest.map((destination, i) => ({ connector: i === 0 ? '↳ ' : '  ', destination }))];
    return { name, description: target, value, lines };
  };
  const routes = section === 'families'
    ? FAMILY_KEYS.map(f => {
        const target = map.families[f];
        return option(f, target ? destination(target) : 'Active Provider (default)', 'family:' + f);
      })
    : section === 'aliases'
      ? map.aliases.map(alias => option(alias.name, destination(alias.target), 'alias:' + alias.name))
      : codexRoutingRows(map, catalog).map(row => option(row.name === row.id ? row.id : row.name + ' · ' + row.id,
          row.description, 'codex-model:' + row.id));
  if (section === 'families') routes.push({ group: 'Actions', name: 'Bind Claude subscription models',
    description: '  Route all four families to Anthropic (Claude.ai).', value: ' bind' });
  if (section === 'aliases') routes.push({ group: 'Actions', name: 'Add alias', description: '', value: 'add' });
  return <Panel title={section === 'families' ? 'Routing — Claude Code' : section === 'codex' ? 'Routing — Codex' : 'Routing — Custom'}>
    {section === 'codex' && catalog.error && wrapWords(`${catalog.error} Saved routes remain editable.`, cols).map((line, i) => <text key={i} wrapMode="none" flexShrink={0} fg={ink.note}>{line}</text>)}
    <text fg={ink.heading} wrapMode="none" height={1}><strong>{wide
      ? '  ' + sourceLabel.padEnd(sourceWidth) + '   Destination'
      : '  ' + sourceLabel + ' → Destination'}</strong></text>
    {section === 'aliases' && !map.aliases.length && <text fg={ink.note}>  No aliases yet.</text>}
    <WrapSelect key={section} cols={cols} maxRows={14} options={routes}
      onSelect={(_i, opt) => {
        const v = opt.value;
        if (v === 'add') { onAddAlias(); return; }
        if (v === ' bind') { onBind(); return; }
        const key = v.slice(v.indexOf(':') + 1);
        onPickRow(v.startsWith('family:') ? { kind: 'family', family: key as FamilyKey } : { kind: v.startsWith('codex-model:') ? 'codex-model' : 'alias', name: key });
      }}
    />
  </Panel>;
};

// Name a new alias — precheck the Provider-id shadow rule while the name is still editable.
export const AliasNameScreen = ({ onBack, onStatus, onNamed }: {
  onBack: (message: string) => void;
  onStatus: (message: string) => void;
  onNamed: (name: string) => void;
}) => (
  <Panel title="New alias name">
    <input {...useInputColors()}
      focused
      placeholder="a bridged model name, e.g. fast"
      onSubmit={onSubmitText((value) => {
        const name = value.trim();
        if (!name) { onBack('Empty — no alias added.'); return; }
        // Precheck the shadow rule here so the collision message lands while the name is
        // still editable (core's withAlias refuses it again at persist time).
        if (PROVIDERS.some((p) => p.id === name)) { onStatus(`"${name}" is a Provider id — pick another name.`); return; }
        onNamed(name);
      })}
    />
  </Panel>
);

// Rename an existing alias in place — Target kept, only the bridged name changes.
export const AliasRenameScreen = ({ name, onBack, onStatus }: {
  name: string;
  onBack: (message: string) => void;
  onStatus: (message: string) => void;
}) => (
  <Panel title={`Rename alias ${name}`}>
    <input {...useInputColors()}
      focused
      placeholder={name}
      onSubmit={onSubmitText((value) => {
        const next = value.trim();
        if (!next || next === name) { onBack('Unchanged.'); return; }
        // Split the two refusals so the message names the actual collision; input stays editable.
        if (PROVIDERS.some((p) => p.id === next)) { onStatus(`"${next}" is a Provider id — pick another name.`); return; }
        let applied = false;
        try {
          home.updateConfig(cfg => {
            const renamed = withAliasRenamed(cfg.routing ?? EMPTY_ROUTING_MAP, PROVIDERS, name, next);
            applied = !!renamed;
            return renamed ? { ...cfg, routing: renamed } : undefined;
          });
        } catch (error) { onStatus(String(error)); return; }
        if (!applied) { onStatus(`"${next}" is already an alias — pick another name.`); return; }
        onBack(`Alias ${name} → ${next}.`);
      })}
    />
  </Panel>
);

// Pick a row's Provider — alias rows lead with the rename/remove verbs.
export const RouteProviderScreen = ({ row, cols, onClear, onRename, onPick }: {
  row: RouteRow;
  cols: number;
  onClear: () => void;
  onRename: (name: string) => void;
  onPick: (p: Provider) => void;
}) => (
  <Panel title={`Route ${rowLabel(row)} via...`}>
    {useRouteTrace(row, rowTarget(routingMap(), row)).view}
    <WrapSelect
      cols={cols}
      maxRows={12}
      options={[
        // Alias rows lead with the edit verbs (#79) — no scrolling past every Provider to
        // rename. Only for aliases already IN the map: the add-alias flow passes through here
        // before its row is persisted, and rename/remove on a nonexistent alias dead-ends.
        // Leading-space values can't collide with Provider ids (ids never start with a space).
        ...(row.kind === 'alias' && routingMap().aliases.some((a) => a.name === (row as { name: string }).name)
          ? [
              { name: 'Rename alias', description: 'keep the Target, change the bridged name', value: ' rename' },
              { name: 'Remove alias', description: 'delete this bridged name', value: ' clear' },
            ]
          : []),
        ...PROVIDERS.map((p) => ({ name: p.label, description: p.id, value: p.id })),
        // A Family route is cleared, never renamed — its picker keeps clear at the bottom.
        ...(row.kind !== 'alias'
          ? [{ name: 'Clear route', description: row.kind === 'family' ? 'family falls back to the Active Provider' : 'remove this binding; Alias precedence still applies', value: ' clear' }]
          : []),
      ]}
      onSelect={(_i, opt) => {
        if (opt.value === ' clear') { onClear(); return; }
        if (opt.value === ' rename' && row.kind === 'alias') { onRename(row.name); return; }
        const p = PROVIDERS.find((x) => x.id === opt.value);
        if (p) onPick(p);
      }}
    />
  </Panel>
);

// The route-model fetch's parking line — the shell starter resolves it to pick or free entry.
export const RouteModelLoadingScreen = ({ provider }: { provider: Provider }) => (
  <text wrapMode="none" flexShrink={0} fg={useTuiInk().note} marginTop={1}>Fetching models for {provider.label}…</text>
);

const destination = (target?: Target) => target ? `${target.providerId} / ${target.model}` : 'No explicit route';

const useRouteTrace = (row: RouteRow, assigned?: Target, proposed?: Target) => {
  const ink = useTuiInk();
  const { width, height } = useTerminalDimensions();
  const panelWidth = Math.min(flightWidth(width), 76);
  const wide = panelWidth >= 72 && height >= 28;
  const source = rowLabel(row);
  const sourceCols = Math.min(18, Math.max(9, source.length + 2));
  const cols = Math.max(1, panelWidth - (wide ? sourceCols + 21 : 0));
  const changed = proposed && (proposed.model !== assigned?.model || proposed.providerId !== assigned?.providerId);
  const label = (name: string, target?: Target) => {
    const destInk = target ? ink.value : ink.note;
    if (cols < name.length + 3) return [
      ...wrapWords(name, cols).map((line, i) => <text key={`label-${i}`} fg={ink.heading} height={1}>{line}</text>),
      ...wrapWords(destination(target), cols).map((line, i) => <text key={i} fg={destInk} height={1}>{line}</text>),
    ];
    return wrapWords(name + '   ' + destination(target), cols).map((line, i) =>
      <text key={i} fg={destInk} height={1} wrapMode="none">
        {i === 0 ? <><span fg={ink.heading}>{name}</span>{line.slice(name.length)}</> : line}
      </text>);
  };
  const sourceLines = wrapWords(source, wide ? sourceCols : cols);
  const assignedLines = label('Assigned', assigned);
  const proposedLines = proposed ? label('Proposed', proposed) : [];
  const targetRows = assignedLines.length + proposedLines.length;
  const rows = wide ? Math.max(8, sourceLines.length, targetRows + 2) : sourceLines.length + targetRows;
  const view = <box flexDirection={wide ? 'row' : 'column'}>
    <box width={wide ? sourceCols : '100%'} justifyContent="center">
      {sourceLines.map((part, i) => <text key={i} fg={ink.heading}><strong>{part}</strong></text>)}
    </box>
    {wide && <box width={21} height={8}><ArtRows rows={traces[changed ? 2 : 0]} /></box>}
    <box flexGrow={1} justifyContent={wide ? 'space-between' : 'flex-start'} paddingY={wide ? 1 : 0}>
      <box>{assignedLines}</box>
      {proposed && <box>{proposedLines}</box>}
    </box>
  </box>;
  return { view, rows };
};

export const RouteConfirmScreen = ({ row, target }: { row: RouteRow; target: Target }) => {
  const ink = useTuiInk();
  const trace = useRouteTrace(row, rowTarget(routingMap(), row), target);
  return <Panel title="Apply this route?">
    {trace.view}
    <text fg={ink.note} marginTop={1}><span fg={ink.value}>Enter</span> apply   <span fg={ink.value}>Esc</span> revise</text>
  </Panel>;
};

// Pick the row's pinned model from the Provider's curated/live list.
export const RouteModelPickScreen = ({ row, provider, options, draft, onApply, onManual, onRefresh }: {
  row: RouteRow;
  provider: Provider;
  options: string[];
  draft?: string;
  onManual: () => void;
  onRefresh: () => void;
  onApply: (target: Target) => void;
}) => {
  const [index, setIndex] = useState(Math.max(0, options.indexOf(draft ?? '')));
  const { width, height } = useTerminalDimensions();
  const chromeRows = commandFrameFits(width, height) ? 10 : 7;
  const assigned = rowTarget(routingMap(), row);
  const model = options[index];
  const trace = useRouteTrace(row, assigned, model ? { providerId: provider.id, model } : undefined);
  return (
    <Panel title={`Model for ${rowLabel(row)} - ${provider.label}`}>
      {trace.view}
      {/* "(current)" only when the row already targets THIS provider — two providers can list the same id */}
      <ChoiceList
        height={Math.max(1, Math.min(options.length + 2, 14, height - chromeRows - trace.rows))}
        selectedIndex={index}
        onChange={(next) => setIndex(next)}
        showDescription={false}
        options={[...options.map((id) => ({
            name: assigned?.providerId === provider.id && assigned.model === id ? `${id} (current)` : id,
            description: '',
            value: id,
        })), { name: 'Enter a model id…', description: '', value: ' manual' }, { name: 'Refresh models', description: '', value: ' refresh' }]}
        onSelect={(_i, opt) => {
          if (opt?.value === ' manual') { onManual(); return; }
          if (opt?.value === ' refresh') { onRefresh(); return; }
          if (opt) onApply({ providerId: provider.id, model: String(opt.value) });
        }}
      />
    </Panel>
  );
};

// No live list — free-typed model id for the row; empty keeps the old route.
export const RouteModelFreeScreen = ({ row, provider, draft, onApply, onEmpty }: {
  row: RouteRow;
  provider: Provider;
  onApply: (target: Target) => void;
  draft?: string;
  onEmpty: () => void;
}) => {
  const { width } = useTerminalDimensions();
  const cols = Math.min(flightWidth(width), 76);
  const title = [
    `Model for ${rowLabel(row)} - ${provider.label} (no live list - type an id)`,
    `${rowLabel(row)} → ${provider.label} · type an id`,
  ].find(label => Bun.stringWidth(label) <= cols) ?? 'Model ID';
  return <Panel title={title}>
    <input {...useInputColors()}
      focused
      value={draft}
      placeholder={provider.defaultModel || 'model id'}
      onSubmit={onSubmitText((value) => {
        const id = value.trim();
        if (id) onApply({ providerId: provider.id, model: id });
        else onEmpty();
      })}
    />
  </Panel>;
};
