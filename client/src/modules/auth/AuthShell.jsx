// Two-panel layout shared by the auth pages (prototype "auth" section).
import Icon from '../../components/Icon.jsx';

export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <div className="auth-side">
        <div className="big">Your<br /><b>NUST</b></div>
        <p>Sign in with your NUST email to post listings, request rides and join projects.</p>
        <ul>
          <li><Icon name="check" />Only verified NUST emails can join</li>
          <li><Icon name="check" />Phone numbers stay private until you approve</li>
          <li><Icon name="check" />Menus and listings are open to browse without an account</li>
        </ul>
      </div>
      <div className="auth-form">{children}</div>
    </div>
  );
}
