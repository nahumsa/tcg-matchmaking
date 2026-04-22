/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ParticipantJoin from './ParticipantJoin';
import { config } from '../config';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ParticipantJoin', () => {
  const mockPokemonList = [
    { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
    { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
    { name: 'eevee', url: 'https://pokeapi.co/api/v2/pokemon/133/' },
  ];

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_language', 'en');
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: mockPokemonList })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    }));
    mockNavigate.mockClear();
  });

  it('renders correctly', async () => {
    render(
      <MemoryRouter>
        <ParticipantJoin />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Join Tournament/i })).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/e.g. Ash Ketchum/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText('Tournament Code')[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Join Tournament/i })).toBeInTheDocument();
    expect(screen.getByText(/Deck Pokémon/i)).toBeInTheDocument();
  });

  it('handles form submission successfully', async () => {
    const mockParticipant = {
      id: 1,
      name: 'Ash Ketchum',
      tournament_id: 1,
      reconnect_code: 'reconnect-secret-1',
      points: 0,
      pokemon_1: null,
      pokemon_2: null,
    };

    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: mockPokemonList })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockParticipant)
      });
    });

    render(
      <MemoryRouter>
        <ParticipantJoin />
      </MemoryRouter>
    );

    // Wait for pokemon to load so button is enabled
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/e.g. Ash Ketchum/i), { target: { value: 'Ash Ketchum' } });
    fireEvent.change(screen.getAllByLabelText('Tournament Code')[0], { target: { value: 'ABCDEF' } });

    const submitBtn = screen.getByRole('button', { name: /Join Tournament/i });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Joining.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`${config.apiUrl}/tournaments/ABCDEF/join`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Ash Ketchum', pokemon_1: null, pokemon_2: null })
      }));
    });

    expect(screen.getByText(/Your reconnect code/i)).toBeInTheDocument();
    expect(screen.getByText('reconnect-secret-1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Go to tournament/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/tournament/ABCDEF');
  });

  it('submits selected pokemon choices', async () => {
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: mockPokemonList })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Ash', tournament_id: 1, reconnect_code: 'rc', points: 0, pokemon_1: '25', pokemon_2: '133' })
      });
    });

    render(
      <MemoryRouter>
        <ParticipantJoin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/e.g. Ash Ketchum/i), { target: { value: 'Ash' } });
    fireEvent.change(screen.getAllByLabelText('Tournament Code')[0], { target: { value: 'ABCDEF' } });

    const pokemonButtons = screen.getAllByRole('button', { name: /choose a pokémon/i });

    // Select Pikachu (ID 25)
    fireEvent.click(pokemonButtons[0]);
    fireEvent.change(screen.getByPlaceholderText(/Search Pokémon.../i), { target: { value: 'pikachu' } });
    fireEvent.click(screen.getByRole('button', { name: /pikachu/i }));

    // Select Eevee (ID 133)
    fireEvent.click(pokemonButtons[1]);
    fireEvent.change(screen.getByPlaceholderText(/Search Pokémon.../i), { target: { value: 'eevee' } });
    fireEvent.click(screen.getByRole('button', { name: /eevee/i }));

    const submitBtn = screen.getByRole('button', { name: /Join Tournament/i });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`${config.apiUrl}/tournaments/ABCDEF/join`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Ash', pokemon_1: '25', pokemon_2: '133' })
      }));
    });
  });

  it('handles form submission error', async () => {
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: mockPokemonList })
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ detail: 'Tournament not found' })
      });
    });

    render(
      <MemoryRouter>
        <ParticipantJoin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/e.g. Ash Ketchum/i), { target: { value: 'Ash' } });
    fireEvent.change(screen.getAllByLabelText('Tournament Code')[0], { target: { value: 'WRONG1' } });

    const submitBtn = screen.getByRole('button', { name: /Join Tournament/i });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Tournament not found/i)).toBeInTheDocument();
    });
  });

  it('displays error when name is already taken', async () => {
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: mockPokemonList })
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ detail: 'Participant with this name already exists in this tournament' })
      });
    });

    render(
      <MemoryRouter>
        <ParticipantJoin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/e.g. Ash Ketchum/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getAllByLabelText('Tournament Code')[0], { target: { value: 'ABCDEF' } });

    const submitBtn = screen.getByRole('button', { name: /Join Tournament/i });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Participant with this name already exists/i)).toBeInTheDocument();
    });
  });

  it('reconnects participant with reconnect code', async () => {
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: mockPokemonList })
        });
      }
      if (url.includes('/participants/relogin')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 42, name: 'Ash', tournament_id: 1, points: 0, is_active: true, dropped_round: null })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <ParticipantJoin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Reconnect Code'), {
      target: { value: 'my-secret' }
    });
    fireEvent.change(screen.getAllByLabelText('Tournament Code')[1], {
      target: { value: 'ABCDEF' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Reconnect/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`${config.apiUrl}/tournaments/ABCDEF/participants/relogin`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ reconnect_code: 'my-secret' })
      }));
      expect(localStorage.getItem('participant_id_ABCDEF')).toBe('42');
      expect(mockNavigate).toHaveBeenCalledWith('/tournament/ABCDEF');
    });
  });
});
