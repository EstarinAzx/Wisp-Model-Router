// Flight's responsive wordmark and Lantern use the approved terminal-cell artwork.
import { useMemo } from 'react';
import { baseNameWidth, colors, homeArt, lanternWidth, wordmark, type Run } from './flightArt';
import { FOREGROUND } from './theme';

export const flightWidth = (columns: number) =>
  Math.max(1, columns - 2 * Math.max(2, Math.min(8, Math.round(columns * .04))));

export const ArtRows = ({ rows }: { rows: Run[][] }) => rows.map((runs, row) => (
  <text key={row} height={1} wrapMode="none">
    {runs.map((run, i) => <span key={i} fg={colors[run.ink]}>{run.text}</span>)}
  </text>
));

const letters = wordmark(baseNameWidth);

export const Flight = ({ width, height }: { width: number; height: number }) => {
  const flying = width >= 74 && height >= 21;
  // Keep the mark and wake at the approved 80-column window size.
  const rows = useMemo(() => homeArt(flying ? 74 : lanternWidth, 1, baseNameWidth, flying), [flying]);
  const brand = width >= baseNameWidth && height >= 14
    ? <box width={baseNameWidth} height={letters.length}>{letters.map((row, i) =>
        <text key={i} height={1} fg={FOREGROUND}>{row}</text>)}</box>
    : <text height={1} fg={FOREGROUND}>Wisp_</text>;
  return <box alignItems={flying ? 'flex-start' : 'center'}>
    {flying ? <box width={74} height={rows.length}>
      <ArtRows rows={rows} />
      <box position="absolute" left={0} top={12 - letters.length}>{brand}</box>
    </box> : <>
      {width >= lanternWidth && height >= 23 && <box width={lanternWidth} height={10}><ArtRows rows={rows} /></box>}
      {brand}
    </>}
    <text height={1} fg={FOREGROUND}>BYOK model router</text>
  </box>;
};
