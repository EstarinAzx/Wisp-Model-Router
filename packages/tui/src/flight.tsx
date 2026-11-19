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

export const Flight = ({ width, height }: { width: number; height: number }) => {
  const flying = width >= 74 && height >= 21;
  const scale = flying && width >= 148 && height >= 38 ? 2 : 1;
  const nameWidth = flying && scale === 1
    ? Math.max(baseNameWidth, Math.round(.9 * Math.min(baseNameWidth * 2, width - lanternWidth - 5)))
    : baseNameWidth * scale;
  const artWidth = flying ? (scale === 1 ? Math.min(width, nameWidth + lanternWidth + 5) : width) : lanternWidth;
  const rows = useMemo(() => homeArt(artWidth, scale, nameWidth, flying), [artWidth, scale, nameWidth, flying]);
  const letters = useMemo(() => wordmark(nameWidth), [nameWidth]);
  const brand = width >= nameWidth && height >= 14
    ? <box width={nameWidth} height={letters.length}>{letters.map((row, i) =>
        <text key={i} height={1} fg={FOREGROUND}>{row}</text>)}</box>
    : <text height={1} fg={FOREGROUND}>Wisp_</text>;
  return <box alignItems={flying ? 'flex-start' : 'center'}>
    {flying ? <box width={artWidth} height={rows.length}>
      <ArtRows rows={rows} />
      <box position="absolute" left={0} top={12 * scale - letters.length}>{brand}</box>
    </box> : <>
      {width >= lanternWidth && height >= 23 && <box width={lanternWidth} height={10}><ArtRows rows={rows} /></box>}
      {brand}
    </>}
    <text height={1} fg={FOREGROUND}>BYOK model router</text>
  </box>;
};
