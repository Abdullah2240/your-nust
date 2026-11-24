// <Modal open onClose title footer>children</Modal>. Closes on Escape or backdrop click.
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, footer, children, wide }) {
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      const target = boxRef.current?.querySelector('[autofocus], .btn-primary, input, textarea, select, button');
      target?.focus();
    }, 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="overlay on" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal${wide ? ' modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} ref={boxRef}>
        {title && <h2>{title}</h2>}
        {children}
        {footer && <div className="actions">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
