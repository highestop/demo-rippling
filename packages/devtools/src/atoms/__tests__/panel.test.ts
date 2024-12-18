import { expect } from 'vitest';
import { computed, command, state } from 'ccstate';
import { screen } from '@testing-library/react';
import { delay } from 'signal-timers';
import { panelTest } from './context';
import { selectedFilter$, storeEvents$, toggleFilter$ } from '../events';
import userEvent from '@testing-library/user-event';
panelTest('should got message', async ({ panel }) => {
  const base$ = state(0);
  panel.testStore.set(base$, 1);

  await delay(10);
  const eventRows = await screen.findAllByTestId('event-row');
  expect(eventRows).toHaveLength(1);
});

panelTest('mixup all events', async ({ panel }) => {
  const base$ = state(0, {
    debugLabel: 'base$',
  });
  const double$ = computed((get) => get(base$) * 2, {
    debugLabel: 'double$',
  });
  const result$ = state(0, {
    debugLabel: 'result$',
  });

  const unsub = panel.testStore.sub(
    double$,
    command(
      ({ get, set }) => {
        set(result$, get(double$) * 10);
      },
      {
        debugLabel: 'callback$',
      },
    ),
  );

  panel.testStore.set(base$, 100);
  unsub();

  panel.panelStore.set(toggleFilter$, 'get');
  panel.panelStore.set(toggleFilter$, 'unsub');
  panel.panelStore.set(toggleFilter$, 'mount');
  panel.panelStore.set(toggleFilter$, 'unmount');
  expect(panel.panelStore.get(selectedFilter$)).toEqual(
    new Set(['set', 'sub', 'notify', 'get', 'unsub', 'mount', 'unmount']),
  );

  const eventRows = await screen.findAllByTestId('event-row');

  expect(eventRows).toHaveLength(12); // magic number to verify the events
});

panelTest('error computed', async ({ panel }) => {
  const error$ = computed(
    () => {
      throw new Error('test');
    },
    {
      debugLabel: 'error$',
    },
  );

  panel.panelStore.set(toggleFilter$, 'get');
  expect(panel.panelStore.get(selectedFilter$)).toContain('get');

  expect(() => panel.testStore.get(error$)).toThrow();
  await screen.findAllByTestId('event-row');
  expect(panel.panelStore.get(storeEvents$).map((event$) => panel.panelStore.get(event$))).toEqual([
    {
      time: expect.any(Number) as number,
      state: 'error',
      eventId: expect.any(Number) as number,
      targetAtom: expect.stringContaining('error$') as string,
      type: 'get',
    },
  ]);
});

panelTest('filter atom label', async ({ panel }) => {
  const base1$ = state(0, {
    debugLabel: 'base1$',
  });
  const base2$ = state(0, {
    debugLabel: 'base2$',
  });

  panel.testStore.set(base1$, 1);
  panel.testStore.set(base2$, 2);

  await delay(10);
  const eventRows = await screen.findAllByTestId('event-row');
  expect(eventRows).toHaveLength(2);

  const input = screen.getByPlaceholderText('filter atom label');
  const user = userEvent.setup();
  await user.type(input, 'base1');

  expect(panel.panelStore.get(storeEvents$)).toHaveLength(1);
});
