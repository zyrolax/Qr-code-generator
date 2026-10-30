// The Requesto brand mark: a purple flame + wordmark. Used in the nav, the
// sidebar, and (as an SVG file) the browser favicon.

export function FlameIcon({ className = "h-7 w-7" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        {/* Purple flame gradient: deep brand purple up into a lighter violet. */}
        <linearGradient id="requesto-flame" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8B7BFF" />
          <stop offset="0.55" stopColor="#5B4BF5" />
          <stop offset="1" stopColor="#4537D4" />
        </linearGradient>
      </defs>
      {/* Outer flame */}
      <path
        fill="url(#requesto-flame)"
        d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"
      />
      {/* Inner flame highlight */}
      <path
        fill="#EEECFE"
        opacity="0.9"
        d="M11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"
      />
    </svg>
  );
}

export default function Logo({ withText = true, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <FlameIcon />
      {withText && (
        <span className="text-lg font-extrabold tracking-tight text-brand">Requesto</span>
      )}
    </span>
  );
}
