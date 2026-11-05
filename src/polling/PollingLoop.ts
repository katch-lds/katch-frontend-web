/** Repete uma tarefa a intervalo fixo, sem sobrepor execuções, até ser parada (secção 6; 3 s nas conversas). */
export class PollingLoop {
  static readonly DEFAULT_INTERVAL_MS = 3000;

  private timer: ReturnType<typeof setTimeout> | null = null;

  private running = false;

  constructor(
    private readonly task: () => Promise<void>,
    private readonly intervalMs: number = PollingLoop.DEFAULT_INTERVAL_MS,
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
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  private schedule(delayMs: number): void {
    this.timer = setTimeout(() => {
      void this.tick();
    }, delayMs);
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
