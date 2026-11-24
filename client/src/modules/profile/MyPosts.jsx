import { useSearchParams } from 'react-router';
import { EmptyState, PageHead } from '../../components/ui.jsx';
import { myPostsTabs } from './myPostsTabs.jsx';

export default function MyPosts() {
  const [params, setParams] = useSearchParams();
  const active = myPostsTabs.find((t) => t.key === params.get('tab')) || myPostsTabs[0];

  return (
    <>
      <PageHead title="My posts" subtitle="Everything you've posted, with its status." />
      <div className="wrap body">
        {myPostsTabs.length === 0 ? (
          <EmptyState title="Your posts will appear here." />
        ) : (
          <>
            <div className="tabs" role="tablist">
              {myPostsTabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={t.key === active.key}
                  className={t.key === active.key ? 'on' : ''}
                  onClick={() => setParams({ tab: t.key })}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div role="tabpanel">{active.element}</div>
          </>
        )}
      </div>
    </>
  );
}
