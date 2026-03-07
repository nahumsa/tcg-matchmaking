/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TournamentView from './TournamentView';

describe('ReportScore', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('WebSocket', vi.fn().mockImplementation(function(this: any) {
      this.send = vi.fn();
      this.close = vi.fn();
    }));
    localStorage.clear();
  });

  it('shows Report Score button only for the participant match', async () => {
    const mockCode = 'ABCDEF';
    const mockMatches = [
      { id: 101, round_number: 1, player1_id: 1, player2_id: 2, player1_score: 0, player2_score: 0, is_bye: 0, is_completed: 0, table_number: 1 }
    ];
    const mockStandings = [
      { id: 1, name: 'Alice', rank: 1, points: 0, wins: 0, losses: 0, draws: 0, omw_percentage: 0 },
      { id: 2, name: 'Bob', rank: 2, points: 0, wins: 0, losses: 0, draws: 0, omw_percentage: 0 }
    ];

    // Alice is logged in
    localStorage.setItem(`participant_id_${mockCode}`, '1');

    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/matches')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMatches) });
      if (url.includes('/standings')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStandings) });
      if (url.includes('/potential-pairings')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
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
      expect(screen.getByText(/Report Score/i)).toBeInTheDocument();
    });
  });

  it('does NOT show Report Score button for matches the participant is NOT in', async () => {
    const mockCode = 'ABCDEF';
    const mockMatches = [
      { id: 101, round_number: 1, player1_id: 1, player2_id: 2, player1_score: 0, player2_score: 0, is_bye: 0, is_completed: 0, table_number: 1 },
      { id: 102, round_number: 1, player1_id: 3, player2_id: 4, player1_score: 0, player2_score: 0, is_bye: 0, is_completed: 0, table_number: 2 }
    ];
    const mockStandings = [
      { id: 1, name: 'Alice', rank: 1, points: 0, wins: 0, losses: 0, draws: 0, omw_percentage: 0 },
      { id: 2, name: 'Bob', rank: 2, points: 0, wins: 0, losses: 0, draws: 0, omw_percentage: 0 },
      { id: 3, name: 'Charlie', rank: 3, points: 0, wins: 0, losses: 0, draws: 0, omw_percentage: 0 },
      { id: 4, name: 'David', rank: 4, points: 0, wins: 0, losses: 0, draws: 0, omw_percentage: 0 }
    ];

    // Alice is logged in
    localStorage.setItem(`participant_id_${mockCode}`, '1');

    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/matches')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMatches) });
      if (url.includes('/standings')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStandings) });
      if (url.includes('/potential-pairings')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
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
      // Should be only ONE "Report Score" button (for Alice's match)
      const buttons = screen.getAllByText(/Report Score/i);
      expect(buttons.length).toBe(1);
    });
  });

  it('opens report modal and submits score', async () => {
    const mockCode = 'ABCDEF';
    const mockMatch = { id: 101, round_number: 1, player1_id: 1, player2_id: 2, player1_score: 0, player2_score: 0, is_bye: 0, is_completed: 0, table_number: 1 };
    
    localStorage.setItem(`participant_id_${mockCode}`, '1');

    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/matches')) return Promise.resolve({ ok: true, json: () => Promise.resolve([mockMatch]) });
      if (url.includes('/standings')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      if (url.includes('/potential-pairings')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      if (url.includes('/report')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ ...mockMatch, is_completed: 1, player1_score: 2, player2_score: 1 }) });
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
      fireEvent.click(screen.getByText(/Report Score/i));
    });

    // Check if modal options are present
    expect(screen.getByText('2 - 0')).toBeInTheDocument();
    expect(screen.getByText('2 - 1')).toBeInTheDocument();
    expect(screen.getByText('1 - 2')).toBeInTheDocument();
    expect(screen.getByText('0 - 2')).toBeInTheDocument();

    // Select 2 - 1
    fireEvent.click(screen.getByText('2 - 1'));

    // Submit
    fireEvent.click(screen.getByText(/Submit Result/i));

    await waitFor(() => {
      // Check if fetch was called with correct data
      const reportCall = (fetch as any).mock.calls.find((call: any) => call[0].includes('/report'));
      expect(reportCall).toBeDefined();
      const body = JSON.parse(reportCall[1].body);
      expect(body.player1_score).toBe(2);
      expect(body.player2_score).toBe(1);
      expect(body.reported_by_id).toBe(1);
    });
  });
});
