import { useEffect, useId, useState, type ReactNode } from 'react';
import { FocusTrap } from 'focus-trap-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const titleId = useId();
  const [trapActive, setTrapActive] = useState(false);

  // Deferred by a tick on purpose: activating the trap (and its
  // clickOutsideDeactivates handling) in the very same click that opens
  // the modal makes focus-trap see that originating click — still
  // finishing its bubble through `document` — as an "outside click" on
  // its own trigger button, and the modal closes itself immediately.
  // Confirmed live in a real browser (not reproducible in jsdom, where
  // there's no real event to still be in flight) before landing on this.
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react/set-state-in-effect -- resets the flag synchronously on the closing transition; not derivable from render
      setTrapActive(false);
      return;
    }
    const timer = setTimeout(() => setTrapActive(true), 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal__backdrop" onClick={onClose}>
      <FocusTrap
        active={trapActive}
        focusTrapOptions={{
          onDeactivate: onClose,
          // Without this, focus-trap swallows clicks outside its
          // container (stopImmediatePropagation) before they ever reach
          // our own backdrop onClick — we want the backdrop click to
          // close the modal, not be silently absorbed.
          clickOutsideDeactivates: true,
          // 'full' (the default) checks real layout to decide if a node is
          // visible/tabbable, which jsdom doesn't compute — harmless to
          // skip since nothing in here is ever hidden-but-tabbable.
          tabbableOptions: { displayCheck: 'none' },
        }}
      >
        <div
          className="modal__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal__header">
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
            <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
          <div className="modal__body">{children}</div>
        </div>
      </FocusTrap>
    </div>
  );
}
