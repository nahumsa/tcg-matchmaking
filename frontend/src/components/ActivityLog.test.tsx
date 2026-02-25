import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ActivityLog, { ActivityEvent } from './ActivityLog';

describe('ActivityLog', () => {
  it('renders empty state correctly', () => {
    render(<ActivityLog events={[]} />);
    expect(screen.getByText(/No recent activity/i)).toBeInTheDocument();
  });

  it('renders events correctly', () => {
    const mockEvents: ActivityEvent[] = [
      {
        id: '1',
        type: 'participant_joined',
        message: 'Alice joined the tournament.',
        timestamp: '2026-02-25T19:00:00Z'
      },
      {
        id: '2',
        type: 'match_reported',
        message: 'Match results reported.',
        timestamp: '2026-02-25T19:05:00Z'
      }
    ];

    render(<ActivityLog events={mockEvents} />);
    
    expect(screen.getByText(/PARTICIPANT JOINED/i)).toBeInTheDocument();
    expect(screen.getByText(/Alice joined the tournament./i)).toBeInTheDocument();
    expect(screen.getByText(/MATCH REPORTED/i)).toBeInTheDocument();
    expect(screen.getByText(/Match results reported./i)).toBeInTheDocument();
  });
});
