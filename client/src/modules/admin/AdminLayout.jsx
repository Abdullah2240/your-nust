import { NavLink, Route, Routes } from 'react-router';
import { PageHead, EmptyState } from '../../components/ui.jsx';
import { adminTabs } from './adminTabs.jsx';

export default function AdminLayout() {
  return (
    <>
      <PageHead title="Admin panel" subtitle="Manage menus, approvals, reports and users." />
      <div className="wrap body">
        <div className="admin-split">
          <nav className="admin-nav" aria-label="Admin sections">
            {adminTabs.map((t) => (
              <NavLink key={t.path} to={t.path ? `/admin/${t.path}` : '/admin'} end={!t.path}>
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div>
            <Routes>
              {adminTabs.map((t) => (
                <Route key={t.path} path={t.path || undefined} index={!t.path} element={t.element} />
              ))}
              <Route path="*" element={<EmptyState title="This admin section doesn't exist." />} />
            </Routes>
          </div>
        </div>
      </div>
    </>
  );
}
