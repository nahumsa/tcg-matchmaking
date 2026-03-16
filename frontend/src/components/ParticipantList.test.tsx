/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ParticipantList from './ParticipantList';

describe('ParticipantList', () => {
  const mockTournamentCode = 'ABCDEF';
  const mockParticipants = [
    { id: 1, name: 'Alice', points: 3 },
    { id: 2, name: 'Bob', points: 0 }
  ];
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_language', 'en');
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
    vi.stubGlobal('confirm', vi.fn(() => true));
    mockOnUpdate.mockClear();
  });

  it('renders participant list correctly', async () => {
    render(
      <ParticipantList
        tournamentCode={mockTournamentCode}
        participants={mockParticipants}
        onUpdate={mockOnUpdate}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Participants/i)[0]).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('handles manual participant addition', async () => {
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            results: [
              { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
              { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' }
            ]
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 3, name: 'Charlie', points: 0 })
      });
    });

    render(
      <ParticipantList
        tournamentCode={mockTournamentCode}
        participants={[]}
        onUpdate={mockOnUpdate}
      />
    );

    const input = screen.getByPlaceholderText(/Player Name/i);
    const addButton = screen.getByRole('button', { name: /Add/i });

    fireEvent.change(input, { target: { value: 'Charlie' } });

    const pokemonButtons = await screen.findAllByRole('button', { name: /Choose a Pokémon/i });
    fireEvent.click(pokemonButtons[0]);
    fireEvent.click(await screen.findByRole('button', { name: /bulbasaur/i }));
    fireEvent.click(pokemonButtons[1]);
    fireEvent.click(await screen.findByRole('button', { name: /charmander/i }));

    fireEvent.click(addButton);

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/tournaments/${mockTournamentCode}/participants`),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ name: 'Charlie', pokemon_1: '1', pokemon_2: '4' })
          })
        );
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('handles participant removal', async () => {
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        });
      }
      return Promise.resolve({ ok: true });
    });

    render(
      <ParticipantList
        tournamentCode={mockTournamentCode}
        participants={mockParticipants}
        onUpdate={mockOnUpdate}
      />
    );

    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    fireEvent.click(removeButtons[0]); // Remove Alice

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/tournaments/${mockTournamentCode}/participants/1`),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });
});
