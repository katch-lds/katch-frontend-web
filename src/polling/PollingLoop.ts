import type { Cancel, IPollingScheduler } from './IPollingScheduler';
import { pollingConfig } from './config';
import { TimeoutPollingScheduler } from './TimeoutPollingScheduler';

/** Repete uma tarefa a intervalo fixo, sem sobrepor execuções, até ser parada (secção 6; 3 s nas conversas). */
export class PollingLoop {
  static readonly DEFAULT_INTERVAL_MS = pollingConfig.conversationsIntervalMs;

  private pending: Cancel | null = null;

  private running = false;

  constructor(
    private readonly task: () => Promise<void>,
    private readonly intervalMs: number = PollingLoop.DEFAULT_INTERVAL_MS,
    private readonly scheduler: IPollingScheduler = new TimeoutPollingScheduler(),
  ) {}

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.schedule(0);
  }

  stop(): void {
    this.running = false;
    this.pending?.();
    this.pending = null;
  }

  isRunning(): boolean {
    return this.running;
  }

  private schedule(delayMs: number): void {
    this.pending = this.scheduler.schedule(delayMs, () => this.tick());
  }

  private async tick(): Promise<void> {
    try {
      await this.task();
    } catch {
      // A falha de uma consulta não interrompe o ciclo: a seguinte é feita no intervalo normal.
    }
    if (this.running) {
      this.schedule(this.intervalMs);
    }
  }
}
