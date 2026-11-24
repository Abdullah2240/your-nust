import { Link } from 'react-router';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div>
          <div className="logo">Your <b style={{ color: '#8EC5FF' }}>NUST</b></div>
          <p>A community noticeboard for the H-12 campus. Built by students of BESE-15A for CS344 Web Engineering.</p>
        </div>
        <div>
          <h4>Modules</h4>
          <Link to="/cafeterias">Cafeterias</Link>
          <Link to="/lost-found">Lost &amp; Found</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/carpool">Carpool</Link>
        </div>
        <div>
          <h4>Help</h4>
          <Link to="/about">About</Link>
          <Link to="/safety">Safety guidelines</Link>
          <Link to="/safety#reporting">Report a post</Link>
        </div>
      </div>
      <div className="legal">
        <div className="wrap">
          <span>© {new Date().getFullYear()} Your NUST</span>
          <span className="mono">v0.1</span>
        </div>
      </div>
    </footer>
  );
}
