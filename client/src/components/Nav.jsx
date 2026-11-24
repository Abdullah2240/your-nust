import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext.jsx';
import Icon from './Icon.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import NotificationBell from '../modules/notifications/NotificationBell.jsx';

const LINKS = [
  { to: '/cafeterias', label: 'Cafeterias' },
  { to: '/lost-found', label: 'Lost & Found' },
  { to: '/projects', label: 'Projects' },
  { to: '/carpool', label: 'Carpool' },
];

function UserMenu() {
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (to) => { setOpen(false); navigate(to); };
  const firstName = user.name.split(' ')[0];

  return (
    <div className="usermenu" ref={ref}>
      <button type="button" className="ghost" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="user" /> <span className="usermenu-name">{firstName}</span>
      </button>
      {open && (
        <div className="usermenu-list" role="menu">
          <p className="usermenu-head">{user.name}<span className="meta">{user.email}</span></p>
          <button role="menuitem" onClick={() => go('/me/profile')}>Profile and skills</button>
          <button role="menuitem" onClick={() => go('/me/posts')}>My posts</button>
          <button role="menuitem" onClick={() => go('/me/requests')}>My requests</button>
          <button role="menuitem" onClick={() => go('/notifications')}>Notifications</button>
          {isAdmin && <button role="menuitem" onClick={() => go('/admin')}>Admin panel</button>}
          <button role="menuitem" onClick={async () => { setOpen(false); await signOut(); navigate('/'); }}>Sign out</button>
        </div>
      )}
    </div>
  );
}

export default function Nav() {
  const { isSignedIn, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className="nav" aria-label="Main">
      <div className="wrap">
        <Link className="logo" to="/">Your <b>NUST</b></Link>
        <div className={`links${menuOpen ? ' open' : ''}`} id="links">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>{l.label}</NavLink>
          ))}
        </div>
        <div className="nav-right">
          <ThemeToggle />
          {isSignedIn && <NotificationBell />}
          {!loading && (isSignedIn ? <UserMenu /> : <Link className="ghost" to="/signin">Sign in</Link>)}
          <button type="button" className="ghost sq menu-btn" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="links" onClick={() => setMenuOpen((o) => !o)}>
            <Icon name={menuOpen ? 'x' : 'menu'} />
          </button>
        </div>
      </div>
    </nav>
  );
}
