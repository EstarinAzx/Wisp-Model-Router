// Flight's responsive wordmark and Lantern use the approved terminal-cell artwork.
import { useEffect, useMemo, useState } from 'react';
import { baseNameWidth, colors, flamePhases, homeArt, lanternWidth, routeArt, wordmark } from './flightArt';
import { FOREGROUND, useTuiInk } from './theme';

export const flightWidth = (columns: number) =>
  Math.max(1, columns - 2 * Math.max(2, Math.min(8, Math.round(columns * .04))));

// Only a visible illustration mounts this component. Animation ticks never re-render a picker or input.
export const Lantern = ({ scene }: { scene: 'flying' | 'stacked' | number }) => {
  const animate = process.env.WISP_REDUCED_MOTION !== '1';
  const [phase, setPhase] = useState(0);
  const frames = useMemo(() => Array.from({ length: animate ? flamePhases : 1 }, (_, index) => {
    if (typeof scene === 'number') return routeArt(scene, index);
    const flying = scene === 'flying';
    return homeArt(flying ? 74 : lanternWidth, 1, baseNameWidth, flying, index);
  }), [scene, animate]);
  useEffect(() => {
    if (!animate) return;
    const timer = setInterval(() => setPhase(index => (index + 1) % flamePhases), 200);
    return () => clearInterval(timer);
  }, [animate]);
  return frames[animate ? phase : 0].map((runs, row) => (
    <text key={row} height={1} wrapMode="none">
      {runs.map((run, i) => <span key={i} fg={colors[run.ink]}>{run.text}</span>)}
    </text>
  ));
};

const letters = wordmark(baseNameWidth);

export const Flight = ({ width, height }: { width: number; height: number }) => {
  const ink = useTuiInk();
  const flying = width >= 74 && height >= 21;
  const brand = width >= baseNameWidth && height >= 14
    ? <box width={baseNameWidth} height={letters.length}>{letters.map((row, i) =>
        <text key={i} height={1} fg={FOREGROUND}>{row}</text>)}</box>
    : <text height={1} fg={FOREGROUND}>Wisp_</text>;
  return <box alignItems={flying ? 'flex-start' : 'center'}>
    {flying ? <box width={74} height={14}>
      <Lantern scene="flying" />
      <box position="absolute" left={0} top={12 - letters.length}>{brand}</box>
    </box> : <>
      {width >= lanternWidth && height >= 23 && <box width={lanternWidth} height={10}><Lantern scene="stacked" /></box>}
      {brand}
    </>}
    <text height={1} fg={ink.note}>BYOK model router</text>
  </box>;
};
