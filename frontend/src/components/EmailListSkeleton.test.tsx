import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmailListSkeleton } from './EmailListSkeleton';

describe('EmailListSkeleton', () => {
  it('renders the given label and six placeholder rows', () => {
    const { container } = render(<EmailListSkeleton label="Sign in to see your inbox." />);

    expect(screen.getByText('Sign in to see your inbox.')).toBeInTheDocument();
    expect(container.querySelectorAll('.email-item')).toHaveLength(6);
  });

  it('applies the shimmer class only when active', () => {
    const { container, rerender } = render(<EmailListSkeleton label="Loading…" />);
    expect(container.querySelector('.email-item--shimmer')).not.toBeInTheDocument();

    rerender(<EmailListSkeleton label="Loading…" active />);
    expect(container.querySelector('.email-item--shimmer')).toBeInTheDocument();
  });
});
