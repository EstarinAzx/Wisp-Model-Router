import type { RefObject } from 'react';
import type { InputRenderable } from '@opentui/core';
import type { SlashCommandDef } from '@wisp/core';
import { ACCENT, FOREGROUND, INPUT_COLORS, RULE } from './theme';
import { onSubmitText, wrapWords } from './widgets';

export const PaletteScreen = ({ inputRef, cols, maxRows, suggestions, highlight, onInput, onSubmit }: {
  inputRef: RefObject<InputRenderable | null>;
  cols: number;
  maxRows: number;
  suggestions: SlashCommandDef[];
  highlight: number;
  onInput: (value: string) => void;
  onSubmit: (raw: string) => void;
}) => {
  const items = suggestions.map(command => {
    const label = '/' + command.name + (command.args ? ' ' + command.args : '');
    const full = label + '   ' + command.description;
    return full.length <= cols - 3 ? [full] : [label, ...wrapWords(command.description, Math.max(1, cols - 3))];
  });
  // Keep the highlighted command in view even when descriptions occupy multiple rows.
  let first = highlight;
  let used = items[highlight]?.length ?? 0;
  while (first > 0 && used + items[first - 1].length <= maxRows) used += items[--first].length;
  return <>
    <box flexDirection="row" border={['bottom']} borderColor={RULE} flexShrink={0}>
      <text height={1} fg={ACCENT}>›   </text>
      <input ref={inputRef} {...INPUT_COLORS} flexGrow={1} placeholder="Type / for commands"
        focused onInput={onInput} onSubmit={onSubmitText(onSubmit)} />
    </box>
    {items.length > 0 && <box marginTop={1} height={Math.min(maxRows, items.slice(first).reduce((n, rows) => n + rows.length, 0))} overflow="hidden">
      {items.slice(first).map((lines, i) => lines.map((line, j) =>
        <text key={suggestions[first + i].name + ':' + j} height={1} flexShrink={0} wrapMode="none" fg={FOREGROUND}>
          <span fg={ACCENT}>{first + i === highlight && j === 0 ? '›  ' : '   '}</span>
          {first + i === highlight && j === 0 ? <strong>{line}</strong> : line}
        </text>))}
    </box>}
  </>;
};
