/**
 * @jest-environment node
 */
import { ConnectionMonitor } from './ConnectionMonitor';

describe('ConnectionMonitor', () => {
  it('avisa só quando o estado muda e deixa de avisar depois de cancelar', () => {
    const monitor = new ConnectionMonitor();
    const listener = jest.fn();
    const unsubscribe = monitor.subscribe(listener);

    monitor.reportSuccess();
    monitor.reportFailure();
    monitor.reportFailure();
    monitor.reportSuccess();
    unsubscribe();
    monitor.reportFailure();

    expect(listener.mock.calls).toEqual([[false], [true]]);
    expect(monitor.isOnline()).toBe(false);
  });
});
