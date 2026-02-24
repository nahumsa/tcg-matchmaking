import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDashboard from './AdminDashboard';

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders correctly', () => {
    render(<AdminDashboard />);
    expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Swiss Open #1/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create New Tournament/i })).toBeInTheDocument();
  });

  it('handles form submission successfully', async () => {
    const mockTournament = {
      id: 1,
      name: 'Swiss Open #1',
      code: 'ABCDEF',
      rounds: 5
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTournament)
    });

    render(<AdminDashboard />);

    fireEvent.change(screen.getByPlaceholderText(/e.g. Swiss Open #1/i), { target: { value: 'Swiss Open #1' } });
    fireEvent.change(screen.getByLabelText(/Number of Rounds/i), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /Create New Tournament/i }));

    expect(screen.getByText(/Creating.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Tournament Created!/i)).toBeInTheDocument();
      expect(screen.getByText(/ABCDEF/i)).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('http://localhost:8000/tournaments', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'Swiss Open #1', rounds: 5 })
    }));
  });

  it('handles form submission error', async () => {
    (fetch as any).mockResolvedValue({
      ok: false
    });

    render(<AdminDashboard />);

    fireEvent.change(screen.getByPlaceholderText(/e.g. Swiss Open #1/i), { target: { value: 'Error Tournament' } });
    fireEvent.click(screen.getByRole('button', { name: /Create New Tournament/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to create tournament/i)).toBeInTheDocument();
    });
  });
});
