import { expect, test } from 'bun:test';
import { baseNameWidth, homeArt, routeArt, type Run } from '../src/flightArt';

const lines = (rows: Run[][]) => rows.map(row => row.map(run => run.text).join(''));
const withoutFlame = (rows: string[]) => rows.map(row => row.replace(/[\u2580-\u259f]/g, ' '));

test('only the flame moves in both the wide and stacked home artwork', () => {
  for (const [width, flying] of [[74, true], [34, false]] as const) {
    const first = lines(homeArt(width, 1, baseNameWidth, flying, 0));
    const next = lines(homeArt(width, 1, baseNameWidth, flying, 1));
    expect(next).not.toEqual(first);
    expect(withoutFlame(next)).toEqual(withoutFlame(first));
    expect(next.every(row => row.length === width)).toBe(true);
  }
});

test('the routing flame flickers with a tapered base at each of its three stops', () => {
  let previousTop = -1;
  for (const stop of [0, 1, 2]) {
    const first = lines(routeArt(stop, 0));
    expect(lines(routeArt(stop, 1))).not.toEqual(first);
    for (const phase of [0, 1, 2, 3]) {
      const rows = lines(routeArt(stop, phase));
      const widths = rows.map(row => (row.match(/[\u2580-\u259f]/g) ?? []).length);
      const silhouette = widths.filter(Boolean);
      expect(silhouette.length).toBeGreaterThanOrEqual(3);
      expect(silhouette.at(-1)!).toBeLessThan(Math.max(...silhouette));
      expect(rows.length).toBe(8);
      expect(rows.every(row => row.length === 21)).toBe(true);
      const top = widths.findIndex(Boolean);
      expect(top).toBeGreaterThan(previousTop);
    }
    previousTop = first.findIndex(row => /[\u2580-\u259f]/.test(row));
  }
});
