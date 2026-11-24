// Icons ported from the prototype sprite. Usage: <Icon name="food" />
const PATHS = {
  'search': <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  'food': <><path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3v7"/></>,
  'lost': <><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></>,
  'users': <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  'car': <><path d="M3 17v-5l2.5-5h13l2.5 5v5M3 17h18M3 12h18"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></>,
  'key': <><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M15 8l2 2"/></>,
  'card': <><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M14 10h4M14 13h3"/></>,
  'plug': <><path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0zM12 17v5"/></>,
  'shirt': <><path d="M20.4 6.6 16 4a4 4 0 0 1-8 0L3.6 6.6 5 11l2-1v10h10V10l2 1z"/></>,
  'bowl': <><path d="M3 11h18a9 9 0 0 1-18 0zM8 7c0-1 1-1 1-2s-1-1-1-2M12 7c0-1 1-1 1-2s-1-1-1-2M16 7c0-1 1-1 1-2s-1-1-1-2"/></>,
  'cup': <><path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 2v3M12 2v3"/></>,
  'sun': <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  'moon': <><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></>,
  'menu': <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  'pin': <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></>,
  'clock': <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  'arrow': <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  'back': <><path d="M19 12H5M11 6l-6 6 6 6"/></>,
  'flag': <><path d="M4 22V4M4 4h13l-2 4 2 4H4"/></>,
  'info': <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
  'seat': <><path d="M7 4v9h10M7 13l-1 7M17 13v7M10 9h7"/></>,
  'repeat': <><path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/></>,
  'check': <><path d="m5 12 5 5 9-10"/></>,
  'upload': <><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></>,
  'bell': <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  'x': <><path d="M18 6 6 18M6 6l12 12"/></>,
  'user': <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
};

export const ICON_NAMES = Object.keys(PATHS);

export default function Icon({ name, className = '', size, title }) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg className={`i ${className}`} style={style} viewBox="0 0 24 24" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      {PATHS[name] ?? PATHS.lost}
    </svg>
  );
}
