import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleProvider } from '../context/RoleContext';
import NavigationBar from './NavigationBar';

describe('NavigationBar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders correctly with default role', () => {
    render(
      <RoleProvider>
        <NavigationBar />
      </RoleProvider>
    );
    expect(screen.getByText(/TCG Matchmaking/i)).toBeInTheDocument();
    expect(screen.getByText(/Role: PLAYER/i)).toBeInTheDocument();
  });

  it('allows switching role to ADMIN', () => {
    render(
      <RoleProvider>
        <NavigationBar />
      </RoleProvider>
    );

    const dropdown = screen.getByRole('combobox');
    fireEvent.change(dropdown, { target: { value: 'ADMIN' } });

    expect(screen.getByText(/Role: ADMIN/i)).toBeInTheDocument();
    expect(localStorage.getItem('tcg_user_role')).toBe('ADMIN');
  });

  it('allows switching role back to PLAYER', () => {
    localStorage.setItem('tcg_user_role', 'ADMIN');
    render(
      <RoleProvider>
        <NavigationBar />
      </RoleProvider>
    );

    expect(screen.getByText(/Role: ADMIN/i)).toBeInTheDocument();

    const dropdown = screen.getByRole('combobox');
    fireEvent.change(dropdown, { target: { value: 'PLAYER' } });

    expect(screen.getByText(/Role: PLAYER/i)).toBeInTheDocument();
    expect(localStorage.getItem('tcg_user_role')).toBe('PLAYER');
  });
});
