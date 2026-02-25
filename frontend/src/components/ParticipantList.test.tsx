import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ParticipantList from './ParticipantList';

describe('ParticipantList', () => {
  const mockTournamentCode = 'ABCDEF';
  const mockParticipants = [
    { id: 1, name: 'Alice', points: 3 },
    { id: 2, name: 'Bob', points: 0 }
  ];

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('renders participant list correctly', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockParticipants)
    });

    render(<ParticipantList tournamentCode={mockTournamentCode} />);

    expect(screen.getAllByText(/Participants/i)[0]).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('handles manual participant addition', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 3, name: 'Charlie', points: 0 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: 3, name: 'Charlie', points: 0 }])
      });

    render(<ParticipantList tournamentCode={mockTournamentCode} />);

    const input = screen.getByPlaceholderText(/Player Name/i);
    const addButton = screen.getByRole('button', { name: /Add/i });

    fireEvent.change(input, { target: { value: 'Charlie' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/tournaments/${mockTournamentCode}/participants`),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Charlie' })
        })
      );
    });
  });

  it('handles participant removal', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockParticipants)
      })
      .mockResolvedValueOnce({
        ok: true
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockParticipants[1]])
      });

    render(<ParticipantList tournamentCode={mockTournamentCode} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    fireEvent.click(removeButtons[0]); // Remove Alice

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/tournaments/${mockTournamentCode}/participants/1`),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });
});
