// Create a ride at /carpool/new, or update seats, notes and status at /carpool/:id/edit.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { api } from '../../lib/api.js';
import { DAYS } from '../../lib/constants.js';
import { useToast } from '../../components/Toast.jsx';
import { Button, Card, ErrorState, Field, Input, PageHead, Segmented, Select, Spinner, Textarea } from '../../components/ui.jsx';
import SafetyNotice from './SafetyNotice.jsx';
import './carpool.css';

const PLACES = ['H-12, Gate 1', 'G-11', 'I-8', 'Bahria Phase 7', 'DHA II', 'F-10 Markaz', 'Saddar'];

// "2026-11-30T08:15" in the user's own time zone, for the datetime-local input's min value.
function localNow() {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

export default function RideForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const toast = useToast();

  const [loaded, setLoaded] = useState(!editing);
  const [loadError, setLoadError] = useState(null);
  const [ride, setRide] = useState(null);
  const [form, setForm] = useState({ kind: search.get('kind') === 'request' ? 'request' : 'offer', frequency: 'one-time', origin: '', destination: '', when: '', days: [], time: '08:00', seats: '1', notes: '', status: 'Active' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.get(`/carpool/${id}`)
      .then((r) => {
        setRide(r);
        setForm((f) => ({ ...f, seats: String(r.seats), notes: r.notes || '', status: r.status }));
        setLoaded(true);
      })
      .catch(setLoadError);
  }, [editing, id]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleDay = (d) => setForm((f) => ({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError('');
    try {
      if (editing) {
        await api.patch(`/carpool/${id}`, { seats: Number(form.seats), notes: form.notes, status: form.status });
        toast('Ride updated.');
        navigate(`/carpool/${id}`);
      } else {
        const body = { kind: form.kind, frequency: form.frequency, origin: form.origin, destination: form.destination, seats: Number(form.seats), notes: form.notes };
        if (form.frequency === 'one-time') body.departAt = form.when ? new Date(form.when).toISOString() : '';
        else Object.assign(body, { days: form.days, time: form.time });
        await api.post('/carpool', body);
        toast(form.frequency === 'recurring' ? 'Submitted. An admin will approve recurring rides before they appear.' : 'Ride posted.');
        navigate('/me/posts?tab=rides');
      }
    } catch (err) {
      setErrors(err.fields || {});
      setFormError(Object.keys(err.fields || {}).length ? '' : err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loadError) return <div className="wrap body"><ErrorState error={loadError} /></div>;
  if (!loaded) return <div className="wrap body"><Spinner /></div>;
  const isOffer = (editing ? ride.kind : form.kind) === 'offer';

  return (
    <>
      <PageHead title={editing ? 'Update ride' : form.kind === 'offer' ? 'Offer a ride' : 'Ask for a ride'} subtitle="Only verified NUST members can see rides." />
      <div className="wrap body">
        <SafetyNotice />
        <Card className="form-card">
          <form onSubmit={submit} noValidate>
            {formError && <p className="form-error" role="alert">{formError}</p>}

            {!editing && (
              <>
                <Field label="What are you posting?" error={errors.kind}>
                  <Segmented label="Offer or request" value={form.kind} onChange={(v) => setForm((f) => ({ ...f, kind: v }))} options={[{ value: 'offer', label: 'Offering a ride' }, { value: 'request', label: 'Need a ride' }]} />
                </Field>
                <Field label="How often?" error={errors.frequency} hint={form.frequency === 'recurring' ? 'Recurring rides are checked by an admin before they appear.' : undefined}>
                  <Segmented label="One-time or recurring" value={form.frequency} onChange={(v) => setForm((f) => ({ ...f, frequency: v }))} options={[{ value: 'one-time', label: 'One-time' }, { value: 'recurring', label: 'Recurring' }]} />
                </Field>
                <datalist id="place-suggestions">{PLACES.map((x) => <option key={x} value={x} />)}</datalist>
                <div className="grid2">
                  <Field label="From" error={errors.origin}>
                    {(fid) => <Input id={fid} list="place-suggestions" value={form.origin} onChange={set('origin')} maxLength={60} invalid={!!errors.origin} placeholder="For example: G-11" />}
                  </Field>
                  <Field label="To" error={errors.destination}>
                    {(fid) => <Input id={fid} list="place-suggestions" value={form.destination} onChange={set('destination')} maxLength={60} invalid={!!errors.destination} placeholder="For example: H-12, Gate 1" />}
                  </Field>
                </div>
                {form.frequency === 'one-time' ? (
                  <Field label="Date and time" error={errors.departAt}>
                    {(fid) => <Input id={fid} type="datetime-local" min={localNow()} value={form.when} onChange={set('when')} invalid={!!errors.departAt} />}
                  </Field>
                ) : (
                  <>
                    <Field label="Days" error={errors.days}>
                      <div className="day-pick" role="group" aria-label="Days of the week">
                        {DAYS.map((d) => (
                          <button key={d} type="button" className={`chip${form.days.includes(d) ? ' on' : ''}`} aria-pressed={form.days.includes(d)} onClick={() => toggleDay(d)}>{d}</button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Departure time" error={errors.time}>
                      {(fid) => <Input id={fid} type="time" value={form.time} onChange={set('time')} invalid={!!errors.time} />}
                    </Field>
                  </>
                )}
              </>
            )}

            {editing && (
              <>
                <p className="muted" style={{ marginBottom: 18 }}>{ride.origin} to {ride.destination}. The route and time can't be changed. Post a new ride if they changed.</p>
                <Field label="Status" error={errors.status}>
                  {(fid) => <Select id={fid} value={form.status} onChange={set('status')} options={[{ value: 'Active', label: 'Active' }, { value: 'Full', label: 'Full' }, { value: 'Completed', label: 'Completed' }, { value: 'Cancelled', label: 'Cancelled' }]} />}
                </Field>
              </>
            )}

            <Field label={isOffer ? 'Seats offered' : 'Seats needed'} error={errors.seats}>
              {(fid) => <Input id={fid} type="number" min={editing ? 0 : 1} max="8" value={form.seats} onChange={set('seats')} invalid={!!errors.seats} />}
            </Field>
            <Field label="Notes (optional)" error={errors.notes} hint="Pick-up spot, luggage, anything riders should know. Don't put phone numbers here.">
              {(fid) => <Textarea id={fid} rows={3} maxLength={300} value={form.notes} onChange={set('notes')} invalid={!!errors.notes} />}
            </Field>

            <div className="actions" style={{ marginTop: 8 }}>
              <Button as={Link} to={editing ? `/carpool/${id}` : '/carpool'} variant="tertiary">Cancel</Button>
              <Button variant="primary" type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Post ride'}</Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
