// Shared UI kit. See /dev/ui for every component rendered. Class names come from the prototype CSS.
import { useId } from 'react';

const cx = (...parts) => parts.filter(Boolean).join(' ');

// variant: 'primary' (ONE per view) | 'secondary' | 'tertiary'. Pass `as={Link}` + `to` for links.
export function Button({ variant = 'tertiary', block, className, as: As = 'button', type, ...props }) {
  const extra = As === 'button' ? { type: type || 'button' } : {};
  return <As className={cx('btn', `btn-${variant}`, block && 'btn-block', className)} {...extra} {...props} />;
}

export function TextButton({ className, ...props }) {
  return <button type="button" className={cx('textlink', className)} {...props} />;
}

export function Card({ className, as: As = 'div', ...props }) {
  return <As className={cx('card', className)} {...props} />;
}

export function Chip({ className, ...props }) {
  return <span className={cx('chip', className)} {...props} />;
}

const STATUS_CLASS = {
  Open: 's-ok', Active: 's-ok', approved: 's-ok',
  Full: 's-warn', pending: 's-warn',
  Closed: 's-bad', Cancelled: 's-bad', rejected: 's-bad', declined: 's-bad',
  Resolved: 's-done', Completed: 's-done', withdrawn: 's-done',
};
const STATUS_LABEL = { approved: 'Approved', pending: 'Pending', rejected: 'Not approved', declined: 'Declined', withdrawn: 'Withdrawn' };

// Always a dot plus a word, never colour alone.
export function StatusDot({ status, label }) {
  return <span className={cx('status', STATUS_CLASS[status] || 's-done')}>{label || STATUS_LABEL[status] || status}</span>;
}

// Wraps one input with its label, hint and error. Children get the generated id.
export function Field({ label, hint, error, children, id: givenId, className }) {
  const autoId = useId();
  const id = givenId || autoId;
  const child = typeof children === 'function' ? children(id) : children;
  return (
    <div className={cx('field', className)}>
      {label && <label htmlFor={id}>{label}</label>}
      {child}
      {hint && !error && <p className="hint">{hint}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

export function Input({ className, invalid, ...props }) {
  return <input className={cx('input', invalid && 'invalid', className)} aria-invalid={invalid || undefined} {...props} />;
}

export function Select({ className, invalid, options, children, ...props }) {
  return (
    <select className={cx('select', invalid && 'invalid', className)} aria-invalid={invalid || undefined} {...props}>
      {options
        ? options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>))
        : children}
    </select>
  );
}

export function Textarea({ className, invalid, rows = 4, ...props }) {
  return <textarea rows={rows} className={cx(invalid && 'invalid', className)} aria-invalid={invalid || undefined} {...props} />;
}

// options: [{ value, label }]
export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className={o.value === value ? 'on' : ''} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty">
      {title && <p className="empty-title">{title}</p>}
      {children}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="empty error-state" role="alert">
      <p className="empty-title">{error?.message || "Couldn't load this right now."}</p>
      {onRetry && <Button variant="tertiary" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <span className="spinner" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Page title band. `actions` usually holds the page's single primary button.
export function PageHead({ title, subtitle, actions, eyebrow }) {
  return (
    <div className="pagehead">
      <div className="wrap">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {subtitle && <p className="meta">{subtitle}</p>}
        </div>
        {actions && <div className="actions">{actions}</div>}
      </div>
    </div>
  );
}

export function Toolbar({ children }) {
  return (
    <div className="toolbar">
      <div className="wrap">{children}</div>
    </div>
  );
}
