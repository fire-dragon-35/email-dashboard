import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from './SettingsPanel';

describe('SettingsPanel', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<SettingsPanel isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a plain placeholder when open', () => {
    render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText(/Nothing configurable here yet/)).toBeInTheDocument();
  });
});
