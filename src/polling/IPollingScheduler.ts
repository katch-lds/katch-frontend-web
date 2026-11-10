export type Task = () => Promise<void>;

export type Cancel = () => void;

/** Agenda uma tarefa para daqui a `delayMs` milissegundos e devolve a função que a cancela (DF-15). */
export interface IPollingScheduler {
  schedule(delayMs: number, task: Task): Cancel;
}
