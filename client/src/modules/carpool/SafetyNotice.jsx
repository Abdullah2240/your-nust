import Icon from '../../components/Icon.jsx';

// Always shown on Carpool pages (NFR-7).
export default function SafetyNotice() {
  return (
    <div className="notice">
      <Icon name="info" />
      <span>Your NUST only connects verified members. It does not run background checks, verify drivers, provide insurance, guarantee rides or handle payments.</span>
    </div>
  );
}
