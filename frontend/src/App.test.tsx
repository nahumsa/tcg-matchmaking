import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App';

describe('App Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders NavigationBar and the LandingPage if no role is set', () => {
    render(<App />);
    expect(screen.getByText(/Welcome to TCG Matchmaking/i)).toBeInTheDocument();
    expect(screen.getByText(/Role: NOT SET/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Administrator/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Player/i })).toBeInTheDocument();
  });

  it('redirects from /admin to / if role is null', () => {
    window.history.pushState({}, 'Test page', '/admin');
    render(<App />);
    
    expect(screen.getByText(/Welcome to TCG Matchmaking/i)).toBeInTheDocument();
    expect(screen.queryByText(/Admin Dashboard/i)).not.toBeInTheDocument();
  });

  it('allows access to /admin if role is ADMIN', () => {
    localStorage.setItem('tcg_user_role', 'ADMIN');
    window.history.pushState({}, 'Test page', '/admin');
    render(<App />);
    
    expect(screen.getByRole('heading', { name: /Admin Dashboard/i })).toBeInTheDocument();
  });

  it('redirects from /join to /admin if role is ADMIN', () => {
    localStorage.setItem('tcg_user_role', 'ADMIN');
    window.history.pushState({}, 'Test page', '/join');
    render(<App />);
    
    // Should be redirected to /admin (AdminDashboard component)
    expect(screen.getByRole('heading', { name: /Admin Dashboard/i })).toBeInTheDocument();
    expect(screen.queryByText(/Join Tournament/i)).not.toBeInTheDocument();
  });
});
