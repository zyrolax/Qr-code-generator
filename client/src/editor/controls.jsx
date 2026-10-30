// Small, restrained form controls for the editor's Inspector. Deliberately
// understated: subtle borders, charcoal ink, one clay accent — no heavy
// shadows or gradients.
// A labelled row around any control.
export function Field({ label, hint, children }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/55">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/45">{hint}</span>}
    </label>
  );
}

// A segmented control — the editor's workhorse for align/size/weight/font.
export function Segmented({ value, onChange, options, className = "" }) {
  return (
    <div className={`flex rounded-lg border border-ink/10 bg-white p-0.5 ${className}`}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            title={o.label}
            className={`flex-1 rounded-md px-2 py-1.5 text-sm transition ${
              active ? "bg-ink text-white shadow-sm" : "text-ink/60 hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// A compact on/off switch.
export function ToggleSwitch({ value, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink/80"
    >
      <span>{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition ${value ? "bg-ink" : "bg-ink/20"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${value ? "left-4.5 translate-x-0" : "left-0.5"}`}
          style={{ left: value ? "1.125rem" : "0.125rem" }} />
      </span>
    </button>
  );
}

// A plain text input styled for the panel.
export function TextInput({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40 ${className}`}
      {...props}
    />
  );
}

export function TextAreaInput({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40 ${className}`}
      {...props}
    />
  );
}

// A small secondary action button used inside the panel.
export function PanelButton({ className = "", children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-medium text-ink/80 transition hover:border-ink/40 hover:text-ink ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
