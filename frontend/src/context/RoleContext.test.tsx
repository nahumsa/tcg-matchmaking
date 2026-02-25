import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoleProvider, useRole } from './RoleContext';

describe('RoleContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('provides the default role as null if nothing is in localStorage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RoleProvider>{children}</RoleProvider>
    );

    const { result } = renderHook(() => useRole(), { wrapper });

    expect(result.current.role).toBe(null);
  });

  it('loads initial role from localStorage if present', () => {
    localStorage.setItem('tcg_user_role', 'ADMIN');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RoleProvider>{children}</RoleProvider>
    );

    const { result } = renderHook(() => useRole(), { wrapper });

    expect(result.current.role).toBe('ADMIN');
  });

  it('updates the role and persists to localStorage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RoleProvider>{children}</RoleProvider>
    );

    const { result } = renderHook(() => useRole(), { wrapper });

    act(() => {
      result.current.setRole('ADMIN');
    });

    expect(result.current.role).toBe('ADMIN');
    expect(localStorage.getItem('tcg_user_role')).toBe('ADMIN');
  });

  it('throws error when useRole is used outside RoleProvider', () => {
    // Prevent console.error from cluttering the test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useRole())).toThrow('useRole must be used within a RoleProvider');

    consoleSpy.mockRestore();
  });
});
