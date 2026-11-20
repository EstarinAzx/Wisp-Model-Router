import type { RefObject } from 'react';
import type { InputRenderable } from '@opentui/core';
import type { SlashCommandDef } from '@wisp/core';
import { ACCENT, FOREGROUND, INPUT_COLORS, RULE } from './theme';
import { onSubmitText } from './widgets';

export const PaletteScreen = ({ inputRef, maxRows, suggestions, highlight, onInput, onSubmit }: {
  inputRef: RefObject<InputRenderable | null>;
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
        return <text key={command.name} height={1} wrapMode="none" fg={FOREGROUND}>
          <span fg={ACCENT}>{selected ? '›  ' : '   '}</span>
          {selected ? <strong>/{command.name}</strong> : '/' + command.name}{args}
        </text>;
      })}
    </box>}
  </>;
};
