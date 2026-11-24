import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { api } from '../../lib/api.js';
import { SCHOOLS } from '../../lib/constants.js';
import { Button, Card, Field, Input, PageHead, Select } from '../../components/ui.jsx';
import SkillInput from '../../components/SkillInput.jsx';
import { useToast } from '../../components/Toast.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user.name,
    department: user.department,
    batch: user.batch,
    skills: user.skills,
    phone: user.phone || '',
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const f = error?.fields || {};
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await api.patch('/users/me', form);
      setUser(data.user);
      toast('Profile saved');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead title="Profile and skills" subtitle="Your name, school and skills are visible to other members. Your email and phone are not." />
      <div className="wrap body">
        <Card as="form" className="form-card" onSubmit={save} noValidate>
          {error && !Object.keys(f).length && <p className="form-error" role="alert">{error.message}</p>}
          <Field label="NUST email" hint="Your email can't be changed.">
            {(id) => <Input id={id} value={user.email} disabled />}
          </Field>
          <Field label="Full name" error={f.name}>
            {(id) => <Input id={id} value={form.name} onChange={set('name')} invalid={!!f.name} />}
          </Field>
          <div className="grid2" style={{ gap: 16 }}>
            <Field label="School" error={f.department}>
              {(id) => <Select id={id} value={form.department} onChange={set('department')} options={SCHOOLS} />}
            </Field>
            <Field label="Batch" error={f.batch}>
              {(id) => <Input id={id} value={form.batch} onChange={set('batch')} placeholder="2024" invalid={!!f.batch} />}
            </Field>
          </div>
          <Field label="Skills" error={f.skills} hint="Project owners filter by these. Up to 15.">
            {(id) => <SkillInput id={id} value={form.skills} onChange={(skills) => setForm({ ...form, skills })} max={15} invalid={!!f.skills} />}
          </Field>
          <Field label="Phone, optional" error={f.phone} hint="Never shown publicly. Shared only when you accept a request.">
            {(id) => <Input id={id} type="tel" value={form.phone} onChange={set('phone')} placeholder="03XXXXXXXXX" invalid={!!f.phone} />}
          </Field>
          <div className="actions">
            <Button variant="primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
