import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Navbar } from './Navbar';

describe('Navbar', () => {
  it('shows the logo and the logged-in email', () => {
    render(<Navbar email="me@gmail.com" onDisconnect={vi.fn()} onGoToLanding={vi.fn()} />);

    expect(screen.getByText('Veyra')).toBeInTheDocument();
    expect(screen.getByText(/Logged in as me@gmail.com/)).toBeInTheDocument();
  });

  it('calls onDisconnect when Disconnect is clicked', () => {
    const onDisconnect = vi.fn();
    render(<Navbar email="me@gmail.com" onDisconnect={onDisconnect} onGoToLanding={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(onDisconnect).toHaveBeenCalledOnce();
  });

  it('calls onGoToLanding when the logo is clicked', () => {
    const onGoToLanding = vi.fn();
    render(<Navbar email="me@gmail.com" onDisconnect={vi.fn()} onGoToLanding={onGoToLanding} />);

    fireEvent.click(screen.getByRole('button', { name: 'Veyra' }));

    expect(onGoToLanding).toHaveBeenCalledOnce();
  });

  it('opens the settings panel when Settings is clicked', () => {
    render(<Navbar email="me@gmail.com" onDisconnect={vi.fn()} onGoToLanding={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Settings/ }));

    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
  });
});
