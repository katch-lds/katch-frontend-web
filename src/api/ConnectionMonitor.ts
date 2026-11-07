export type ConnectionListener = (online: boolean) => void;

/** Estado da ligação ao servidor, avisado ao ConnectionBanner (RNF018). */
export class ConnectionMonitor {
  private online = true;

  private readonly listeners = new Set<ConnectionListener>();

  reportSuccess(): void {
    this.set(true);
  }

  reportFailure(): void {
    this.set(false);
  }

  isOnline(): boolean {
    return this.online;
  }

  subscribe(listener: ConnectionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private set(online: boolean): void {
    if (this.online === online) {
      return;
    }
    this.online = online;
    this.listeners.forEach((listener) => listener(online));
  }
}
