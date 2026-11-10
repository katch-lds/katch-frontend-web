/**
 * @jest-environment node
 */
import { pollingConfig } from './config';
import type { IPollingScheduler } from './IPollingScheduler';
import { PollingLoop } from './PollingLoop';
import { TimeoutPollingScheduler } from './TimeoutPollingScheduler';

describe('TimeoutPollingScheduler', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('executa a tarefa depois do atraso e permite cancelá-la', async () => {
    const task = jest.fn().mockResolvedValue(undefined);
    const scheduler = new TimeoutPollingScheduler();

    scheduler.schedule(1000, task);
    const cancel = scheduler.schedule(1000, task);
    cancel();
    await jest.advanceTimersByTimeAsync(999);
    expect(task).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);

    expect(task).toHaveBeenCalledTimes(1);
  });
});

describe('pollingConfig', () => {
  it('fixa a consulta das conversas em 3 segundos (P17)', () => {
    expect(pollingConfig.conversationsIntervalMs).toBe(3000);
    expect(PollingLoop.DEFAULT_INTERVAL_MS).toBe(3000);
  });
});

describe('PollingLoop com um IPollingScheduler próprio', () => {
  it('agenda a primeira execução já e a seguinte só depois da resposta, ao intervalo indicado', async () => {
    const cancel = jest.fn();
    const schedule = jest.fn<
      ReturnType<IPollingScheduler['schedule']>,
      Parameters<IPollingScheduler['schedule']>
    >(() => cancel);
    const task = jest.fn().mockResolvedValue(undefined);
    const loop = new PollingLoop(task, 250, { schedule });

    loop.start();
    expect(schedule).toHaveBeenCalledTimes(1);
    expect(schedule.mock.calls[0][0]).toBe(0);
    expect(task).not.toHaveBeenCalled();

    await schedule.mock.calls[0][1]();
    expect(task).toHaveBeenCalledTimes(1);
    expect(schedule).toHaveBeenCalledTimes(2);
    expect(schedule.mock.calls[1][0]).toBe(250);

    loop.stop();
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
