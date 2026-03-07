/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';

describe('AdminDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_language', 'en');
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders correctly', () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );
    expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Swiss Open #1/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create New Tournament/i })).toBeInTheDocument();
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
    (fetch as any).mockResolvedValue({
      ok: false
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
});
