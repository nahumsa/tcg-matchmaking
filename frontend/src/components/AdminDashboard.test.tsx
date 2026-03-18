/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';

describe('AdminDashboard', () => {
  beforeEach(() => {
    class MockWebSocket {
      url: string;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onclose: (() => void) | null = null;
      onopen: (() => void) | null = null;
      close = vi.fn();
      send = vi.fn();
      addEventListener = vi.fn();
      removeEventListener = vi.fn();

      constructor(url: string) {
        this.url = url;
      }
    }

    vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket);

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    }));
  });

  it('renders correctly', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g. Swiss Open #1/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create New Tournament/i })).toBeInTheDocument();
    });
  });

  it('handles form submission successfully and shows management view', async () => {
    const mockTournament = {
      id: 1,
      name: 'Swiss Open #1',
      code: 'ABCDEF',
      rounds: 5,
      status: 'ACTIVE'
    };

    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        });
      }
      if (url.includes('/tournaments/ABCDEF/matches')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/tournaments/ABCDEF/participants')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTournament)
      });
    });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/e.g. Swiss Open #1/i), { target: { value: 'Swiss Open #1' } });
    fireEvent.click(screen.getByRole('button', { name: /Create New Tournament/i }));

    expect(screen.getByText(/Creating.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Swiss Open #1/i)).toBeInTheDocument();
      expect(screen.getByText(/ABCDEF/i)).toBeInTheDocument();
      expect(screen.getByText(/Start Round 1/i)).toBeInTheDocument();
    });
  });

  it('handles form submission error', async () => {
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/e.g. Swiss Open #1/i), { target: { value: 'Error Tournament' } });
    fireEvent.click(screen.getByRole('button', { name: /Create New Tournament/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to create tournament/i)).toBeInTheDocument();
    });
  });

  it('contains correctly formatted "Public View" links after creation', async () => {
    const mockTournament = {
      id: 1,
      name: 'Swiss Open #1',
      code: 'ABCDEF',
      rounds: 3,
      status: 'ACTIVE'
    };

    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        });
      }
      if (url.includes('/tournaments/ABCDEF/matches')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/tournaments/ABCDEF/participants')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTournament)
      });
    });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/e.g. Swiss Open #1/i), { target: { value: 'Swiss Open #1' } });
    fireEvent.click(screen.getByRole('button', { name: /Create New Tournament/i }));

    await waitFor(() => {
      const publicLinks = screen.getAllByText(/Public View/i);
      expect(publicLinks.length).toBeGreaterThan(0);
      publicLinks.forEach(link => {
        expect(link.closest('a')).toHaveAttribute('href', '/tournament/ABCDEF');
      });
    });
  });

  it('shows win percentage in final standings', async () => {
    const mockTournament = {
      id: 1,
      name: 'Swiss Open #1',
      code: 'ABCDEF',
      rounds: 3,
      status: 'COMPLETED'
    };
    const mockStandings = [
      { id: 1, name: 'Alice', rank: 1, points: 7, wins: 2, losses: 1, draws: 1, omw_percentage: 0.6 }
    ];

    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) });
      }
      if (url.includes('/tournaments/ABCDEF/matches')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/tournaments/ABCDEF/participants')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/tournaments/ABCDEF/standings')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStandings) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTournament)
      });
    });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/e.g. Swiss Open #1/i), { target: { value: 'Swiss Open #1' } });
    fireEvent.click(screen.getByRole('button', { name: /Create New Tournament/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Final Standings/i })).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    expect(await within(table).findByText('62.5%')).toBeInTheDocument();
  });

  it('requires double confirmation before starting the first round', async () => {
    const mockTournament = {
      id: 1,
      name: 'Swiss Open #1',
      code: 'ABCDEF',
      rounds: 3,
      status: 'ACTIVE'
    };

    const fetchMock = vi.fn((url: string) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) });
      }
      if (url.endsWith('/tournaments')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTournament) });
      }
      if (url.includes('/tournaments/ABCDEF/matches')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/tournaments/ABCDEF/participants')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/tournaments/ABCDEF/standings')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/tournaments/ABCDEF/pairings')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Swiss Open #1/i), { target: { value: 'Swiss Open #1' } });
    fireEvent.click(screen.getByRole('button', { name: /Create New Tournament/i }));

    await waitFor(() => {
      expect(screen.getByText(/Swiss Open #1/i)).toBeInTheDocument();
      expect(screen.getByText(/Start Round 1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Start Round 1/i }));

    expect(screen.getByText(/Step 1\/2/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirm Tournament Start/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    const codeInput = screen.getByLabelText(/Type ABCDEF to confirm/i);
    const confirmButton = screen.getByRole('button', { name: /Confirm & Start/i });

    expect(confirmButton).toBeDisabled();

    fireEvent.change(codeInput, { target: { value: 'WRONG' } });
    expect(confirmButton).toBeDisabled();
    expect(fetchMock.mock.calls.filter(([u]) => u.includes('/pairings')).length).toBe(0);

    fireEvent.change(codeInput, { target: { value: 'ABCDEF' } });

    await waitFor(() => {
      expect(confirmButton).not.toBeDisabled();
    });

    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/tournaments/ABCDEF/pairings'), expect.objectContaining({ method: 'POST' }));
    });
  });

  it('uses the report modal to submit admin match results', async () => {
    const mockTournament = {
      id: 1,
      name: 'Swiss Open #1',
      code: 'ABCDEF',
      rounds: 3,
      status: 'ACTIVE'
    };
    const mockMatches = [
      {
        id: 10,
        round_number: 1,
        player1_id: 1,
        player2_id: 2,
        player1_score: 0,
        player2_score: 0,
        is_bye: 0,
        is_completed: 0,
        table_number: 1
      }
    ];
    const mockParticipants = [
      { id: 1, name: 'Alice', points: 0 },
      { id: 2, name: 'Bob', points: 0 }
    ];

    const fetchMock = vi.fn((url: string) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) });
      }
      if (url.endsWith('/tournaments')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTournament) });
      }
      if (url.includes('/tournaments/ABCDEF/matches')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMatches) });
      }
      if (url.includes('/tournaments/ABCDEF/participants')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockParticipants) });
      }
      if (url.includes('/tournaments/ABCDEF/standings')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/tournaments/ABCDEF/matches/10/report')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Swiss Open #1/i), { target: { value: 'Swiss Open #1' } });
    fireEvent.click(screen.getByRole('button', { name: /Create New Tournament/i }));

    await waitFor(() => {
      expect(screen.getByText(/Round 1 of 3/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Report/i }));
    fireEvent.click(screen.getByRole('button', { name: /2 - 0/i }));

    const submitButton = screen.getByRole('button', { name: /Submit Result/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const reportCalls = fetchMock.mock.calls.filter(([u, opts]) => u.toString().includes('/matches/10/report') && opts?.method === 'POST');
      expect(reportCalls.length).toBeGreaterThan(0);
      expect(reportCalls[0][1]?.body).toBe(JSON.stringify({ player1_score: 2, player2_score: 0, is_admin: true }));
    });
  });

  it('shows scores only for completed matches', async () => {
    const mockTournament = {
      id: 1,
      name: 'Swiss Open #1',
      code: 'ABCDEF',
      rounds: 3,
      status: 'ACTIVE'
    };
    const mockMatches = [
      {
        id: 10,
        round_number: 1,
        player1_id: 1,
        player2_id: 2,
        player1_score: 2,
        player2_score: 1,
        is_bye: 0,
        is_completed: 1,
        table_number: 1
      },
      {
        id: 11,
        round_number: 1,
        player1_id: 3,
        player2_id: 4,
        player1_score: 0,
        player2_score: 0,
        is_bye: 0,
        is_completed: 0,
        table_number: 2
      }
    ];
    const mockParticipants = [
      { id: 1, name: 'Alice', points: 0 },
      { id: 2, name: 'Bob', points: 0 },
      { id: 3, name: 'Cara', points: 0 },
      { id: 4, name: 'Dan', points: 0 }
    ];

    const fetchMock = vi.fn((url: string) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) });
      }
      if (url.endsWith('/tournaments')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTournament) });
      }
      if (url.includes('/tournaments/ABCDEF/matches')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMatches) });
      }
      if (url.includes('/tournaments/ABCDEF/participants')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockParticipants) });
      }
      if (url.includes('/tournaments/ABCDEF/standings')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Swiss Open #1/i), { target: { value: 'Swiss Open #1' } });
    fireEvent.click(screen.getByRole('button', { name: /Create New Tournament/i }));

    await waitFor(() => {
      expect(screen.getByText(/Round 1 of 3/i)).toBeInTheDocument();
    });

    const completedScore = screen.getByTestId('match-score-10');
    expect(within(completedScore).getByText('2')).toBeInTheDocument();
    expect(within(completedScore).getByText('-')).toBeInTheDocument();
    expect(within(completedScore).getByText('1')).toBeInTheDocument();
    expect(screen.queryByTestId('match-score-11')).not.toBeInTheDocument();
  });
});
