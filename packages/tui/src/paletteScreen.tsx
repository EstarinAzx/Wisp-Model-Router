import type { RefObject } from 'react';
import type { InputRenderable } from '@opentui/core';
import type { SlashCommandDef } from '@wisp/core';
import { ACCENT, FOREGROUND, INPUT_COLORS, RULE, SELECTION, SELECTED_TEXT } from './theme';
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
  const count = Math.min(5, maxRows);
  const first = Math.max(0, highlight - count + 1);
  const visible = suggestions.slice(first, first + count);
  return <>
    <box flexDirection="row" border={['bottom']} borderColor={RULE} flexShrink={0}>
      <text height={1} fg={ACCENT}>›   </text>
      <input ref={inputRef} {...INPUT_COLORS} flexGrow={1} placeholder="Type / for commands"
        focused onInput={onInput} onSubmit={onSubmitText(onSubmit)} />
    </box>
    {visible.length > 0 && <box marginTop={1}>
      {visible.map((command, i) => {
        const selected = first + i === highlight;
        const args = command.args && !command.args.startsWith('[') && !command.args.startsWith('<') ? ' ' + command.args : '';
        return <text key={command.name} height={1} wrapMode="none" bg={selected ? SELECTION : undefined} fg={selected ? SELECTED_TEXT : FOREGROUND}>
          <span fg={ACCENT}>{selected ? '›  ' : '   '}</span>
          {selected ? <strong>/{command.name}</strong> : '/' + command.name}{args}
        </text>;
      })}
    </box>}
    {visible.length > 0 && maxRows >= 8 && <box marginTop={1}>
      {wrapWords(suggestions[highlight].description, cols).map((line, i) =>
        <text key={i} height={1} fg={FOREGROUND}>{line}</text>)}
    </box>}
  </>;
};
