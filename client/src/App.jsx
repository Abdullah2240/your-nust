import { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthProvider } from './auth/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { AuthPromptProvider } from './components/AuthPrompt.jsx';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/ui.jsx';
import { routes } from './routes.jsx';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthPromptProvider>
            <Layout>
              <Suspense fallback={<Spinner />}>
                <Routes>
                  {routes.map((r) => <Route key={r.path} path={r.path} element={r.element} />)}
                </Routes>
              </Suspense>
            </Layout>
          </AuthPromptProvider>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
