import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders the Veyra credit and a link to the repo', () => {
    render(<Footer />);

    expect(screen.getByText(/Veyra © 2026/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /github.com\/fire-dragon-35\/email-dashboard/ });
    expect(link).toHaveAttribute('href', 'https://github.com/fire-dragon-35/email-dashboard');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
