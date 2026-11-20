import { colors, type Run } from './flightArt';
import { FOREGROUND } from './theme';

export const flightWidth = (columns: number) =>
  Math.min(76, Math.max(1, columns - 2 * Math.max(2, Math.round(columns * .04))));

export const ArtRows = ({ rows }: { rows: Run[][] }) => rows.map((runs, row) => (
  <text key={row} height={1} wrapMode="none">
    {runs.map((run, i) => <span key={i} fg={colors[run.ink]}>{run.text}</span>)}
  </text>
));

const mark = [
  ['▌  ▌▝           ', '           ▗▖'],
  ['▌▗ ▌▐ ▞▀▘▐▀▚    ', '         ▗▟█▙'],
  ['▙▘▚▌▐ ▝▀▖▐ ▐    ', '       ▗▄▟██▛'],
  ['▘  ▘▝ ▀▀ ▐▀▘    ', '   ⢀⣀⠤⠚⠉  ⠉'],
  ['         ▝   ▀▀▀', '⣀⠴⠊'],
];

export const Flight = ({ width, height }: { width: number; height: number }) => (
  <box>
    {height >= 14 && width >= 30 ? mark.map(([name, flame], row) =>
      <text key={row} height={1} wrapMode="none" fg={FOREGROUND}>{name}<span fg={colors[3]}>{flame}</span></text>
    ) : <text height={1} fg={FOREGROUND}>Wisp_</text>}
    <text height={1} fg={FOREGROUND}>BYOK model router</text>
  </box>
);
