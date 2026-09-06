import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders the logo and any children', () => {
    render(
      <PageHeader onLogoClick={vi.fn()}>
        <span>Right side content</span>
      </PageHeader>,
    );

    expect(screen.getByRole('button', { name: 'Veyra' })).toBeInTheDocument();
    expect(screen.getByText('Right side content')).toBeInTheDocument();
  });

  it('calls onLogoClick when the logo is clicked', () => {
    const onLogoClick = vi.fn();
    render(<PageHeader onLogoClick={onLogoClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Veyra' }));

    expect(onLogoClick).toHaveBeenCalledOnce();
  });
});
