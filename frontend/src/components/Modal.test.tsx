import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test">
        content
      </Modal>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the title and children when open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test modal">
        <p>Hello</p>
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: 'Test modal' })).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        content
      </Modal>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        content
      </Modal>,
    );

    fireEvent.click(container.querySelector('.modal__backdrop') as Element);

    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when clicking inside the dialog', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Hello</p>
      </Modal>,
    );

    fireEvent.click(screen.getByText('Hello'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        content
      </Modal>,
    );

    // Trap activation is deferred a tick past mount (see Modal.tsx) so the
    // click that opens the modal isn't misread as an outside click —
    // Escape only does anything once the trap actually goes active.
    await waitFor(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
