import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { api } from '../../lib/api.js';
import { SCHOOLS } from '../../lib/constants.js';
import { Button, Field, Input, Segmented, Select } from '../../components/ui.jsx';
import AuthShell from './AuthShell.jsx';
import CheckInbox from './CheckInbox.jsx';

const thisYear = new Date().getFullYear();
const BATCHES = Array.from({ length: 7 }, (_, i) => String(thisYear - i));

export default function SignUp() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', department: 'SEECS', batch: BATCHES[1], password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const f = error?.fields || {};

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/register', form);
      setSentTo(form.email);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) return <AuthShell><CheckInbox email={sentTo} /></AuthShell>;

  return (
    <AuthShell>
      <div style={{ marginBottom: 28 }}>
        <Segmented
          label="Account"
          value="up"
          onChange={(v) => v === 'in' && navigate(`/signin${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`)}
          options={[{ value: 'in', label: 'Sign in' }, { value: 'up', label: 'Create account' }]}
        />
      </div>
      <form onSubmit={submit} noValidate>
        {error && !Object.keys(f).length && <p className="form-error" role="alert">{error.message}</p>}
        <Field label="Full name" error={f.name}>
          {(id) => <Input id={id} autoComplete="name" value={form.name} onChange={set('name')} placeholder="Ayesha Khan" invalid={!!f.name} />}
        </Field>
        <Field label="NUST email" error={f.email} hint="Only NUST emails can join, for example name@seecs.edu.pk">
          {(id) => <Input id={id} type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="name@seecs.edu.pk" invalid={!!f.email} />}
        </Field>
        <div className="grid2" style={{ gap: 12 }}>
          <Field label="School" error={f.department}>
            {(id) => <Select id={id} value={form.department} onChange={set('department')} options={SCHOOLS} />}
          </Field>
          <Field label="Batch" error={f.batch}>
            {(id) => <Select id={id} value={form.batch} onChange={set('batch')} options={BATCHES} />}
          </Field>
        </div>
        <Field label="Password" error={f.password} hint="At least 8 characters">
          {(id) => <Input id={id} type="password" autoComplete="new-password" value={form.password} onChange={set('password')} invalid={!!f.password} />}
        </Field>
        <Button variant="primary" type="submit" block disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Button>
      </form>
    </AuthShell>
  );
}
