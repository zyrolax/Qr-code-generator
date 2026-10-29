// Small shared UI building blocks. Kept in one file to stay easy to scan.
import { Link } from "react-router-dom";

export function Button({ as = "button", variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    secondary: "bg-brand-light text-brand hover:bg-brand-light/70",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  const cls = `${base} ${variants[variant]} ${className}`;
  const Comp = as === "link" ? Link : as;
  return <Comp className={cls} {...props} />;
}

export function Input({ label, error, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>}
      <input
        className={`w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

export function Textarea({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>}
      <textarea
        className={`w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${className}`}
        {...props}
      />
    </label>
  );
}

// Coloured pill showing a sticker's status.
export function StatusBadge({ status }) {
  const styles = {
    unclaimed: "bg-gray-100 text-gray-600",
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    lost: "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] || ""}`}>
      {status}
    </span>
  );
}

// Inline error / info banners.
export function Alert({ kind = "error", children }) {
  if (!children) return null;
  const styles = {
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-green-50 text-green-700 border-green-200",
  };
  return <div className={`rounded-xl border px-3 py-2 text-sm ${styles[kind]}`}>{children}</div>;
}

export function Card({ className = "", children }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
