import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import NavigationBar from './NavigationBar';

describe('NavigationBar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders correctly', () => {
    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );
    expect(screen.getByText(/TCG Matchmaking/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it('shows standings link if lastCode is in localStorage', () => {
    localStorage.setItem('last_tournament_code', 'ABCDEF');
    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    expect(screen.getByText(/Standings/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Standings/i });
    expect(link).toHaveAttribute('href', '/ABCDEF');
  });
});
