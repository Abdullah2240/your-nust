import { useState } from 'react';
import Icon from './Icon.jsx';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };
  return (
    <button type="button" className="ghost sq" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}
