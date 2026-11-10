import type { Cancel, IPollingScheduler, Task } from './IPollingScheduler';

/** Agendamento com `setTimeout`; nos testes Jest corre com temporizadores simulados. */
export class TimeoutPollingScheduler implements IPollingScheduler {
  schedule(delayMs: number, task: Task): Cancel {
    const timer = setTimeout(() => {
      void task();
    }, delayMs);
    return () => clearTimeout(timer);
  }
}
