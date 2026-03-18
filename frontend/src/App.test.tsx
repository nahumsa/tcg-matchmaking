import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';

describe('App Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_language', 'en');
    // Mock fetch for components that load data on mount
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('pokeapi.co')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });
  });

  it('renders NavigationBar and the LandingPage', () => {
    window.history.pushState({}, 'Home', '/');
    render(<App />);
    expect(screen.getByText(/Welcome to TCG Matchmaking/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Administrator/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Player/i })).toBeInTheDocument();
  });

  it('allows access to /admin directly', async () => {
    window.history.pushState({}, 'Test page', '/admin');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /Admin Dashboard/i })).toBeInTheDocument();
  });

  it('allows access to /join directly', async () => {
    window.history.pushState({}, 'Test page', '/join');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /Join Tournament/i })).toBeInTheDocument();
  });

  it('allows access to /tournament/:code directly', async () => {
    window.history.pushState({}, 'Tournament Page', '/tournament/ABCD');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Tournament/i)).toBeInTheDocument();
      expect(screen.getByText(/ABCD/i)).toBeInTheDocument();
    });
  });

  it('redirects from /:code to /tournament/:code', async () => {
    window.history.pushState({}, 'Legacy Tournament Link', '/ABCD');
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/tournament/ABCD');
      expect(screen.getByText(/Tournament/i)).toBeInTheDocument();
      expect(screen.getByText(/ABCD/i)).toBeInTheDocument();
    });
  });
});
