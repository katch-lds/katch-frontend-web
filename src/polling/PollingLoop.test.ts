/**
 * @jest-environment node
 */
import { PollingLoop } from './PollingLoop';

describe('PollingLoop', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('repete a tarefa a cada intervalo e para quando pedido', async () => {
    const task = jest.fn().mockResolvedValue(undefined);
    const loop = new PollingLoop(task, 3000);

    loop.start();
    loop.start();
    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(3000);
    await jest.advanceTimersByTimeAsync(3000);
    loop.stop();
    await jest.advanceTimersByTimeAsync(9000);

    expect(task).toHaveBeenCalledTimes(3);
    expect(loop.isRunning()).toBe(false);
  });

  it('não interrompe o ciclo quando uma consulta falha', async () => {
    const task = jest
      .fn()
      .mockRejectedValueOnce(new Error('sem ligação'))
      .mockResolvedValue(undefined);
    const loop = new PollingLoop(task);

    loop.start();
    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(PollingLoop.DEFAULT_INTERVAL_MS);
    loop.stop();

    expect(task).toHaveBeenCalledTimes(2);
  });
});
