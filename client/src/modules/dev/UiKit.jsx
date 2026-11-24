// /dev/ui (development builds only): every shared component, for reference while building pages.
import { useState } from 'react';
import { Button, Card, Chip, EmptyState, ErrorState, Field, Input, PageHead, Segmented, Select, Spinner, StatusDot, Textarea, TextButton, Toolbar } from '../../components/ui.jsx';
import Icon, { ICON_NAMES } from '../../components/Icon.jsx';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import SkillInput from '../../components/SkillInput.jsx';
import ImagePicker from '../../components/ImagePicker.jsx';
import ReportButton from '../../components/ReportButton.jsx';
import { useToast } from '../../components/Toast.jsx';
import { useAuthGate } from '../../auth/useAuthGate.js';
import { formatDate, formatRelative, formatRs, formatTime } from '../../lib/format.js';

const STATUSES = ['Open', 'Active', 'approved', 'Full', 'pending', 'Closed', 'Cancelled', 'rejected', 'declined', 'Resolved', 'Completed', 'withdrawn'];

export default function UiKit() {
  const [seg, setSeg] = useState('a');
  const [modal, setModal] = useState(false);
  const [page, setPage] = useState(2);
  const [skills, setSkills] = useState(['React']);
  const [file, setFile] = useState(null);
  const toast = useToast();
  const gate = useAuthGate();

  return (
    <div className="kit">
      <PageHead eyebrow="Developers" title="UI kit" subtitle="Import these from client/src/components. Toggle dark mode in the nav to check both themes." actions={<Button variant="primary">Primary action</Button>} />
      <Toolbar>
        <Input placeholder="Toolbar search" aria-label="Search" />
        <Select aria-label="Sort" options={['Newest', 'Oldest']} />
      </Toolbar>
      <div className="wrap body">
        <section>
          <h2>Buttons</h2>
          <div className="row">
            <Button variant="primary">Primary (one per view)</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="tertiary">Tertiary</Button>
            <Button variant="secondary" disabled>Disabled</Button>
            <TextButton>Text link <Icon name="arrow" /></TextButton>
            <ReportButton targetType="lostfound" targetId="demo" />
          </div>
        </section>

        <section>
          <h2>Chips and status</h2>
          <div className="row"><Chip>Lost</Chip><Chip>Found</Chip><Chip>Recurring</Chip></div>
          <div className="row">{STATUSES.map((s) => <StatusDot key={s} status={s} />)}</div>
        </section>

        <section>
          <h2>Form fields</h2>
          <Card className="form-card">
            <Field label="Text input" hint="Hint text under the field">{(id) => <Input id={id} placeholder="Placeholder" />}</Field>
            <Field label="With an error" error="This field is required">{(id) => <Input id={id} invalid />}</Field>
            <Field label="Select">{(id) => <Select id={id} options={['C1', 'C2', 'C3', 'C4']} />}</Field>
            <Field label="Textarea">{(id) => <Textarea id={id} rows={3} placeholder="Describe it" />}</Field>
            <Field label="Segmented"><Segmented value={seg} onChange={setSeg} options={[{ value: 'a', label: 'Rides offered' }, { value: 'b', label: 'Rides needed' }]} /></Field>
            <Field label="SkillInput">{(id) => <SkillInput id={id} value={skills} onChange={setSkills} />}</Field>
            <Field label="ImagePicker">{(id) => <ImagePicker id={id} value={file} onChange={setFile} />}</Field>
          </Card>
        </section>

        <section>
          <h2>Cards</h2>
          <div className="grid">
            {['Black Casio calculator', 'Steel water bottle', 'Grey zip hoodie'].map((t, i) => (
              <Card key={t} className="link">
                <div className="thumb"><Icon name={['plug', 'cup', 'shirt'][i]} /></div>
                <div className="card-body">
                  <h3>{t}</h3>
                  <span className="meta">SEECS library · Today</span>
                  <span><Chip>{i % 2 ? 'Found' : 'Lost'}</Chip></span>
                  <div className="card-foot"><StatusDot status={i === 2 ? 'Resolved' : 'Open'} /><span className="textlink">View <Icon name="arrow" /></span></div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2>Table and numbers</h2>
          <table className="table">
            <thead><tr><th>Dish</th><th>Cafeteria</th><th>Category</th><th>Price</th></tr></thead>
            <tbody>
              <tr className="cheapest"><td>Daal Chawal</td><td className="mono">C1</td><td className="muted">Rice</td><td className="mono">{formatRs(180)}</td></tr>
              <tr><td>Chicken Biryani</td><td className="mono">C1</td><td className="muted">Rice</td><td className="mono">{formatRs(250)}</td></tr>
            </tbody>
          </table>
          <p className="meta" style={{ marginTop: 12 }}>
            formatDate: <span className="mono">{formatDate(new Date())}</span> · formatRelative: <span className="mono">{formatRelative(new Date())}</span> · formatTime: <span className="mono">{formatTime('08:00')}</span>
          </p>
        </section>

        <section>
          <h2>Notice</h2>
          <div className="notice"><Icon name="info" /><span>Your NUST only connects verified members. It does not run background checks, verify drivers, provide insurance, guarantee rides or handle payments.</span></div>
        </section>

        <section>
          <h2>Feedback</h2>
          <div className="row">
            <Button variant="secondary" onClick={() => setModal(true)}>Open modal</Button>
            <Button variant="secondary" onClick={() => toast('Listing posted')}>Show toast</Button>
            <Button variant="secondary" onClick={() => gate('post a listing', () => toast('You are a verified member'))}>Gated action</Button>
          </div>
          <Pagination page={page} pages={5} onChange={setPage} />
          <Spinner />
          <EmptyState title="No dishes match.">Try a wider price range.</EmptyState>
          <div style={{ marginTop: 16 }}><ErrorState error={{ message: "Couldn't load this right now." }} onRetry={() => toast('Retrying')} /></div>
        </section>

        <section>
          <h2>Icons</h2>
          <div className="row">{ICON_NAMES.map((n) => <span key={n} className="chip" title={n}><Icon name={n} /> {n}</span>)}</div>
        </section>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Example dialog" footer={<><Button variant="tertiary" onClick={() => setModal(false)}>Cancel</Button><Button variant="primary" onClick={() => setModal(false)}>Confirm</Button></>}>
        <p className="muted">Closes on Escape, a backdrop click or a button.</p>
      </Modal>
    </div>
  );
}
