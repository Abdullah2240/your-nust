import { useEffect } from 'react';
import { useLocation } from 'react-router';
import Nav from './Nav.jsx';
import Footer from './Footer.jsx';
import VerifyBanner from './VerifyBanner.jsx';

export default function Layout({ children }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Nav />
      <VerifyBanner />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
