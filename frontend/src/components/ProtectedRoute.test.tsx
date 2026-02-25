import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RoleProvider } from '../context/RoleContext';
import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
  it('renders children if role matches allowedRole', () => {
    localStorage.setItem('tcg_user_role', 'ADMIN');
    render(
      <RoleProvider>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRole="ADMIN" redirectTo="/join">
                  <div>Admin Content</div>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </MemoryRouter>
      </RoleProvider>
    );

    expect(screen.getByText(/Admin Content/i)).toBeInTheDocument();
  });

  it('redirects if role does not match allowedRole', () => {
    localStorage.setItem('tcg_user_role', 'PLAYER');
    render(
      <RoleProvider>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRole="ADMIN" redirectTo="/join">
                  <div>Admin Content</div>
                </ProtectedRoute>
              } 
            />
            <Route path="/join" element={<div>Join Page</div>} />
          </Routes>
        </MemoryRouter>
      </RoleProvider>
    );

    expect(screen.queryByText(/Admin Content/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Join Page/i)).toBeInTheDocument();
  });
});
