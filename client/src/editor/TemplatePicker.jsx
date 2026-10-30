// Starting templates gallery. Applying one replaces the page content with a
// polished layout and matching theme. Warns that existing content is replaced.
import { TEMPLATES } from "./templates.js";
import { getTheme } from "../blocks/themes.js";

export function TemplatePicker({ onApply, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-panel p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">Start from a template</h3>
          <button onClick={onClose} className="text-ink/40 hover:text-ink" aria-label="Close">✕</button>
        </div>
        <p className="mb-4 text-sm text-ink/50">Picking one replaces the current content with a ready-made layout.</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TEMPLATES.map((t) => {
            const theme = getTheme(t.theme);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onApply(t)}
                className="group overflow-hidden rounded-xl border border-ink/10 bg-white text-left transition hover:-translate-y-0.5 hover:border-clay/50 hover:shadow-md"
              >
                <div className="flex h-28 items-center justify-center p-4" style={{ background: theme.pageBg }}>
                  <div
                    className="flex w-full max-w-[110px] flex-col items-center gap-1.5 rounded-lg p-3"
                    style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
                  >
                    <span className="h-2 w-3/4 rounded" style={{ background: theme.ink, opacity: 0.8 }} />
                    <span className="h-1 w-full rounded" style={{ background: theme.muted, opacity: 0.5 }} />
                    <span className="h-1 w-5/6 rounded" style={{ background: theme.muted, opacity: 0.5 }} />
                    <span className="mt-1 h-3.5 w-2/3 rounded" style={{ background: theme.accent }} />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-ink">{t.name}</p>
                  <p className="text-xs text-ink/45">{t.hint}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
