import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTournamentSocket } from './useTournamentSocket';

function SocketHarness({ marker }: { marker: string }) {
  useTournamentSocket({
    code: 'ABCDEF',
    onMessage: () => undefined,
  });

  return <div>{marker}</div>;
}

describe('useTournamentSocket', () => {
  beforeEach(() => {
    const MockWebSocket = vi.fn().mockImplementation(function () {
      this.onopen = null;
      this.onmessage = null;
      this.onerror = null;
      this.onclose = null;
      this.close = vi.fn();
    });

    vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket);
  });

  it('does not recreate socket on unrelated rerenders', async () => {
    const { rerender } = render(<SocketHarness marker="first" />);

    await waitFor(() => {
      expect(screen.getByText('first')).toBeInTheDocument();
    });

    rerender(<SocketHarness marker="second" />);
    expect(screen.getByText('second')).toBeInTheDocument();
    expect(WebSocket).toHaveBeenCalledTimes(1);
  });
});
