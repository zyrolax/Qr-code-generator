// The "add element" surface — a visual gallery of elements with little
// representations of what each one looks like, grouped by purpose. Not a
// dropdown. Opens as a centered sheet; picking a card inserts the block.
import { BLOCK_TYPES, BLOCK_GROUPS } from "../blocks/registry.js";

export function AddElement({ onAdd, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-panel p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">Add an element</h3>
          <button onClick={onClose} className="text-ink/40 hover:text-ink" aria-label="Close">✕</button>
        </div>

        {BLOCK_GROUPS.map((group) => (
          <div key={group} className="mb-5 last:mb-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">{group}</p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {BLOCK_TYPES.filter((b) => b.group === group).map((b) => (
                <button
                  key={b.type}
                  type="button"
                  onClick={() => onAdd(b.type)}
                  className="group flex flex-col gap-2 rounded-xl border border-ink/10 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-clay/50 hover:shadow-sm"
                >
                  <MiniPreview type={b.type} />
                  <div>
                    <p className="text-sm font-medium text-ink">{b.label}</p>
                    <p className="text-xs text-ink/45">{b.hint}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tiny abstract previews so each element reads at a glance.
function MiniPreview({ type }) {
  const frame = "flex h-14 w-full items-center justify-center gap-1 rounded-lg bg-paper px-3";
  const bar = (w, h = "h-1.5") => <span className={`${h} ${w} rounded-full bg-ink/20`} />;
  switch (type) {
    case "heading":
      return <div className={frame}><span className="h-2.5 w-3/4 rounded bg-ink/60" /></div>;
    case "text":
      return <div className={`${frame} flex-col !items-start !justify-center`}>{bar("w-full", "h-1")}{bar("w-5/6", "h-1")}{bar("w-2/3", "h-1")}</div>;
    case "image":
      return <div className={frame}><span className="grid h-10 w-full place-items-center rounded-md bg-ink/10 text-ink/40">🖼</span></div>;
    case "divider":
      return <div className={frame}><span className="h-px w-full bg-ink/25" /></div>;
    case "button":
      return <div className={frame}><span className="rounded-md bg-clay px-4 py-1.5 text-[10px] font-semibold text-white">Button</span></div>;
    case "links":
      return <div className={`${frame} flex-col`}><span className="h-3 w-full rounded-md border border-ink/20" /><span className="h-3 w-full rounded-md border border-ink/20" /></div>;
    case "socials":
      return <div className={frame}><span className="h-6 w-6 rounded-full bg-ink/15" /><span className="h-6 w-6 rounded-full bg-ink/15" /><span className="h-6 w-6 rounded-full bg-ink/15" /></div>;
    case "contact":
      return <div className={`${frame} flex-col !items-stretch`}><span className="flex items-center gap-1"><span>📞</span>{bar("w-2/3", "h-1")}</span><span className="flex items-center gap-1"><span>✉️</span>{bar("w-1/2", "h-1")}</span></div>;
    case "note":
      return <div className={frame}><span className="h-10 w-full rounded-md bg-clay/10" /></div>;
    case "finder_form":
      return <div className={`${frame} flex-col`}><span className="h-2.5 w-full rounded border border-ink/20" /><span className="h-2.5 w-full rounded bg-clay/60" /></div>;
    case "reward":
      return <div className={frame}><span className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] text-amber-700">🎁 Reward</span></div>;
    default:
      return <div className={frame} />;
  }
}
