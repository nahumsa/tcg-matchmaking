import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ParticipantJoin from './ParticipantJoin';

describe('ParticipantJoin', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
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
  });

  it('handles form submission successfully', async () => {
    const mockParticipant = {
      id: 1,
      name: 'Ash Ketchum',
      tournament_id: 1,
      points: 0
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
      // Should have redirected, but we check if it called fetch correctly
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/tournaments/ABCDEF/join', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Ash Ketchum' })
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
    fireEvent.change(screen.getByPlaceholderText(/e.g. ABCDEF/i), { target: { value: 'WRONG' } });
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
