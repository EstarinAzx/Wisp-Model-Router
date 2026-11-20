import { expect, test } from 'bun:test';
import { testRender } from '@opentui/react/test-utils';
import { act } from 'react';
import { Flight } from '../src/flight';
import { RoutingScreen } from '../src/routingScreens';

test('visible home and routing flames animate in the terminal and respect reduced motion', async () => {
  const original = process.env.WISP_REDUCED_MOTION;
  try {
    for (const reduced of [false, true]) {
      process.env.WISP_REDUCED_MOTION = reduced ? '1' : '0';
      for (const view of [
        <Flight width={74} height={26} />,
        <RoutingScreen cols={76} onPick={() => {}} />,
      ]) {
        const ui = await testRender(view, { width: 80, height: 32 });
        try {
          await ui.renderOnce();
          const first = ui.captureCharFrame();
          // Sample successive frames: a loaded runner can overshoot a full animation loop.
          let changed = false;
          for (let sample = 0; sample < 5 && !changed; sample++) {
            await act(async () => { await Bun.sleep(95); });
            await ui.renderOnce();
            changed = ui.captureCharFrame() !== first;
          }
          expect(changed).toBe(!reduced);
        } finally { await act(async () => { ui.renderer.destroy(); }); }
      }
    }
  } finally {
    if (original === undefined) delete process.env.WISP_REDUCED_MOTION;
    else process.env.WISP_REDUCED_MOTION = original;
  }
});
