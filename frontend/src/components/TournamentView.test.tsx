import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TournamentView from './TournamentView';

describe('TournamentView', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('WebSocket', vi.fn().mockImplementation(class {
      send = vi.fn();
      close = vi.fn();
      onmessage = vi.fn();
      onerror = vi.fn();
      onopen = vi.fn();
    }));
  });

  it('renders loading state and then matches', async () => {
    const mockMatches = [
      { id: 1, round_number: 1, player1_id: 1, player2_id: 2, player1_score: 0, player2_score: 0, is_bye: 0, is_completed: 0 }
    ];

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMatches)
    });

    render(
      <MemoryRouter initialEntries={['/ABCDEF']}>
        <Routes>
          <Route path="/:code" element={<TournamentView />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading tournament.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Tournament/i)).toBeInTheDocument();
      expect(screen.getByText(/Round 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Player 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Player 2/i)).toBeInTheDocument();
    });
  });

  it('handles empty matches state', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });

    render(
      <MemoryRouter initialEntries={['/EMPTY1']}>
        <Routes>
          <Route path="/:code" element={<TournamentView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No matches yet/i)).toBeInTheDocument();
    });
  });
});
