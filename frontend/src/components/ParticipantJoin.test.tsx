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
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockNavigate.mockClear();
  });

  it('renders correctly', () => {
    render(
      <MemoryRouter>
        <ParticipantJoin />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /Join Tournament/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Ash Ketchum/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. ABCDEF/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Join Tournament/i })).toBeInTheDocument();
    expect(screen.getByText(/Deck Pokémon/i)).toBeInTheDocument();
  });

  it('handles form submission successfully', async () => {
    const mockParticipant = {
      id: 1,
      name: 'Ash Ketchum',
      tournament_id: 1,
      points: 0,
      pokemon_1: null,
      pokemon_2: null,
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockParticipant)
    });

    render(
      <MemoryRouter>
        <ParticipantJoin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/e.g. Ash Ketchum/i), { target: { value: 'Ash Ketchum' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. ABCDEF/i), { target: { value: 'ABCDEF' } });
    fireEvent.click(screen.getByRole('button', { name: /Join Tournament/i }));

    expect(screen.getByText(/Joining.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/tournament/ABCDEF');
      expect(fetch).toHaveBeenCalledWith(`${config.apiUrl}/tournaments/ABCDEF/join`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Ash Ketchum', pokemon_1: null, pokemon_2: null })
      }));
    });
  });

  it('submits selected pokemon choices', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, name: 'Ash', tournament_id: 1, points: 0, pokemon_1: 'Pikachu', pokemon_2: 'Eevee' })
    });

    render(
      <MemoryRouter>
        <ParticipantJoin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/e.g. Ash Ketchum/i), { target: { value: 'Ash' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. ABCDEF/i), { target: { value: 'ABCDEF' } });

    const pokemonButtons = screen.getAllByRole('button', { name: /choose a pokémon/i });
    fireEvent.click(pokemonButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: /Pikachu/i }));

    fireEvent.click(screen.getByRole('button', { name: /choose a pokémon/i }));
    fireEvent.click(screen.getByRole('button', { name: /Eevee/i }));

    fireEvent.click(screen.getByRole('button', { name: /Join Tournament/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`${config.apiUrl}/tournaments/ABCDEF/join`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Ash', pokemon_1: 'Pikachu', pokemon_2: 'Eevee' })
      }));
    });
  });

  it('handles form submission error', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Tournament not found' })
    });

    render(
      <MemoryRouter>
        <ParticipantJoin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/e.g. Ash Ketchum/i), { target: { value: 'Ash' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. ABCDEF/i), { target: { value: 'WRONG1' } });
    fireEvent.click(screen.getByRole('button', { name: /Join Tournament/i }));

    await waitFor(() => {
      expect(screen.getByText(/Tournament not found/i)).toBeInTheDocument();
    });
  });

  it('displays error when name is already taken', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Participant with this name already exists in this tournament' })
    });

    render(
      <MemoryRouter>
        <ParticipantJoin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/e.g. Ash Ketchum/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. ABCDEF/i), { target: { value: 'ABCDEF' } });
    fireEvent.click(screen.getByRole('button', { name: /Join Tournament/i }));

    await waitFor(() => {
      expect(screen.getByText(/Participant with this name already exists/i)).toBeInTheDocument();
    });
  });
});
