/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TournamentView from './TournamentView';

describe('TournamentView', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('WebSocket', vi.fn().mockImplementation(function(this: any) {
      this.send = vi.fn();
      this.close = vi.fn();
      this.onmessage = null;
      this.onerror = null;
      this.onopen = null;
    }));
  });

  it('renders loading state and then matches with names', async () => {
    const mockMatches = [
      { id: 1, round_number: 1, player1_id: 1, player2_id: 2, player1_score: 0, player2_score: 0, is_bye: 0, is_completed: 0 }
    ];
    const mockStandings = [
      { id: 1, name: 'Alice', rank: 1, points: 0, wins: 0, losses: 0, draws: 0, omw_percentage: 0 },
      { id: 2, name: 'Bob', rank: 2, points: 0, wins: 0, losses: 0, draws: 0, omw_percentage: 0 }
    ];

    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/matches')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMatches) });
      if (url.includes('/standings')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStandings) });
      return Promise.resolve({ ok: false });
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
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('renders table number for matches', async () => {
    const mockMatches = [
      { id: 1, round_number: 1, player1_id: 1, player2_id: 2, player1_score: 0, player2_score: 0, is_bye: 0, is_completed: 0, table_number: 1 }
    ];
    const mockStandings = [
      { id: 1, name: 'Alice', rank: 1, points: 0, wins: 0, losses: 0, draws: 0, omw_percentage: 0 },
      { id: 2, name: 'Bob', rank: 2, points: 0, wins: 0, losses: 0, draws: 0, omw_percentage: 0 }
    ];

    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/matches')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMatches) });
      if (url.includes('/standings')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStandings) });
      return Promise.resolve({ ok: false });
    });

    render(
      <MemoryRouter initialEntries={['/ABCDEF']}>
        <Routes>
          <Route path="/:code" element={<TournamentView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Table 1/i)).toBeInTheDocument();
    });
  });

  it('renders standings and player status', async () => {
    const mockCode = 'ABCDEF';
    const mockStandings = [
      { id: 1, name: 'Alice', rank: 1, points: 3, wins: 1, losses: 0, draws: 0, omw_percentage: 0.5 },
      { id: 2, name: 'Bob', rank: 2, points: 0, wins: 0, losses: 1, draws: 0, omw_percentage: 0.5 }
    ];
    const mockPotential = [
      { id: 2, name: 'Bob', points: 0 }
    ];

    localStorage.setItem(`participant_id_${mockCode}`, '1');

    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/matches')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      if (url.includes('/standings')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStandings) });
      if (url.includes('/potential-pairings')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPotential) });
      return Promise.resolve({ ok: false });
    });

    render(
      <MemoryRouter initialEntries={[`/${mockCode}`]}>
        <Routes>
          <Route path="/:code" element={<TournamentView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/My Status/i)).toBeInTheDocument();
      expect(screen.getByText(/Alice/i)).toBeInTheDocument();
      expect(screen.getByText(/#1/i)).toBeInTheDocument();
      expect(screen.getByText(/1-0-0/i)).toBeInTheDocument();
      expect(screen.getByText(/100.0%/i)).toBeInTheDocument();
      expect(screen.getByText(/Bob/i)).toBeInTheDocument(); // In possible opponents
    });

    // Switch to standings tab
    fireEvent.click(screen.getByRole('button', { name: /Standings/i }));

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
      expect(screen.getAllByText('100.0%').length).toBeGreaterThan(0);
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
