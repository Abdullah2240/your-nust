// <ReportButton targetType="lostfound" targetId={id} />
// Placeholder until task A8 ships POST /api/reports. Keep using it: the props won't change.
import { useAuthGate } from '../auth/useAuthGate.js';
import { useToast } from './Toast.jsx';
import Icon from './Icon.jsx';

export default function ReportButton({ targetType, targetId }) {
  const gate = useAuthGate();
  const toast = useToast();
  return (
    <button
      type="button"
      className="textlink report-link"
      data-target={`${targetType}:${targetId}`}
      onClick={() => gate('report a post', () => toast('Reporting arrives soon.'))}
    >
      <Icon name="flag" /> Report
    </button>
  );
}
