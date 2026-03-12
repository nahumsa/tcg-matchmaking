import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import NavigationBar from './NavigationBar';
import { LanguageProvider } from '../i18n';

describe('NavigationBar', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_language', 'en');
  });

  it('renders correctly with flag language switcher', () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <NavigationBar />
        </MemoryRouter>
      </LanguageProvider>
    );
    expect(screen.getByText(/TCG Matchmaking/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /English/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Portuguese \(Brazil\)/i })).toBeInTheDocument();
  });

  it('defaults to PT-BR when no language is stored', () => {
    localStorage.clear();
    render(
      <LanguageProvider>
        <MemoryRouter>
          <NavigationBar />
        </MemoryRouter>
      </LanguageProvider>
    );

    expect(screen.getByText(/Painel/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Português \(Brasil\)/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('allows switching language through flags', () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <NavigationBar />
        </MemoryRouter>
      </LanguageProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Portuguese \(Brazil\)/i }));

    expect(screen.getByText(/Painel/i)).toBeInTheDocument();
    expect(localStorage.getItem('app_language')).toBe('pt-BR');
  });

  it('shows standings link if lastCode is in localStorage', () => {
    localStorage.setItem('last_tournament_code', 'ABCDEF');
    render(
      <LanguageProvider>
        <MemoryRouter>
          <NavigationBar />
        </MemoryRouter>
      </LanguageProvider>
    );

    expect(screen.getByText(/Standings/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Standings/i });
    expect(link).toHaveAttribute('href', '/ABCDEF');
  });
});
