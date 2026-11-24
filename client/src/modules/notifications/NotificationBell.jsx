import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { api } from '../../lib/api.js';
import Icon from '../../components/Icon.jsx';

// Polls the unread count every 30 s and whenever the window regains focus.
export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const { pathname } = useLocation();

  const load = useCallback(() => {
    api.get('/notifications/unread-count').then((d) => setCount(d.count)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    window.addEventListener('focus', load);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', load);
    };
  }, [load, pathname]);

  return (
    <Link to="/notifications" className="ghost sq bell" aria-label={count ? `Notifications, ${count} unread` : 'Notifications'}>
      <Icon name="bell" />
      {count > 0 && <span className="bell-badge">{count > 99 ? '99+' : count}</span>}
    </Link>
  );
}
