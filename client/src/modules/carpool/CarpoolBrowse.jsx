import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { api } from '../../lib/api.js';
import { useAuthGate } from '../../auth/useAuthGate.js';
import Pagination from '../../components/Pagination.jsx';
import { Button, EmptyState, ErrorState, Input, PageHead, Segmented, Select, Spinner, Toolbar } from '../../components/ui.jsx';
import { useApi } from '../requests/useApi.js';
import RideCard from './RideCard.jsx';
import RideRequestDialog from './RideRequestDialog.jsx';
import SafetyNotice from './SafetyNotice.jsx';
import './carpool.css';

export default function CarpoolBrowse() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const gate = useAuthGate();
  const [target, setTarget] = useState(null);

  const kind = params.get('kind') === 'request' ? 'request' : 'offer';
  const frequency = params.get('frequency') || '';
  const q = params.get('q') || '';
  const page = Number(params.get('page')) || 1;

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries({ page: '', ...changes }).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const { data, error, loading, reload } = useApi(() => api.get('/carpool', { kind, frequency, q, page }), [kind, frequency, q, page]);

  return (
    <>
      <PageHead
        title="Carpool"
        subtitle="Rides to and from H-12, shared between verified members."
        actions={<Button variant="primary" onClick={() => gate('offer a ride', () => navigate('/carpool/new'))}>Offer a ride</Button>}
      />
      <Toolbar>
        <Segmented
          label="Ride direction"
          value={kind}
          onChange={(v) => update({ kind: v === 'offer' ? '' : v })}
          options={[{ value: 'offer', label: 'Rides offered' }, { value: 'request', label: 'Rides needed' }]}
        />
        <Select
          aria-label="Ride type"
          value={frequency}
          onChange={(e) => update({ frequency: e.target.value })}
          options={[{ value: '', label: 'One-time and recurring' }, { value: 'one-time', label: 'One-time' }, { value: 'recurring', label: 'Recurring' }]}
        />
        <Input type="search" aria-label="Search places" placeholder="Search a place, e.g. G-11" value={q} onChange={(e) => update({ q: e.target.value })} />
      </Toolbar>
      <div className="wrap body">
        <SafetyNotice />
        {error && <ErrorState error={error} onRetry={reload} />}
        {!error && loading && !data && <Spinner />}
        {data && data.items.length === 0 && (
          <EmptyState title={kind === 'offer' ? 'No rides offered here yet.' : 'Nobody is asking for a ride right now.'}>
            <p className="meta">{kind === 'offer' ? 'Be the first to offer a ride.' : 'Need a ride? Post a request and drivers will see it.'}</p>
          </EmptyState>
        )}
        {data && data.items.length > 0 && (
          <>
            <div className="grid2">
              {data.items.map((r) => <RideCard key={r.id} ride={r} onRequest={(ride) => gate('send a ride request', () => setTarget(ride))} />)}
            </div>
            <Pagination page={data.page} pages={data.pages} onChange={(p) => update({ page: String(p) })} />
          </>
        )}
      </div>
      <RideRequestDialog ride={target} onClose={() => setTarget(null)} onSent={reload} />
    </>
  );
}
