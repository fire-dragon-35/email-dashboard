import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BrandLogo } from './BrandLogo';

describe('BrandLogo', () => {
  it('renders as a clickable button', () => {
    const onClick = vi.fn();
    render(<BrandLogo onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Veyra' }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
