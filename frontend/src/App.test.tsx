import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App';

describe('App Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders NavigationBar and the LandingPage', () => {
    render(<App />);
    expect(screen.getByText(/Welcome to TCG Matchmaking/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Administrator/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Player/i })).toBeInTheDocument();
  });

  it('allows access to /admin directly', () => {
    window.history.pushState({}, 'Test page', '/admin');
    render(<App />);
    
    expect(screen.getByRole('heading', { name: /Admin Dashboard/i })).toBeInTheDocument();
  });

  it('allows access to /join directly', () => {
    window.history.pushState({}, 'Test page', '/join');
    render(<App />);
    
    expect(screen.getByRole('heading', { name: /Join Tournament/i })).toBeInTheDocument();
  });
});
