import { Input, Textarea } from "../components/ui.jsx";
import { SOCIAL_PLATFORMS } from "./registry.js";

// The edit form for a single block. `onChange(nextProps)` replaces the block's
// props. Each block type gets a small, purpose-built set of fields.
export function BlockFields({ block, onChange }) {
  const p = block.props || {};
  const set = (patch) => onChange({ ...p, ...patch });

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2">
          <Input value={p.text} onChange={(e) => set({ text: e.target.value })} placeholder="Heading text" />
          <Toggle
            value={p.align}
            onChange={(align) => set({ align })}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
            ]}
          />
        </div>
      );

    case "text":
      return (
        <Textarea rows={3} value={p.text} onChange={(e) => set({ text: e.target.value })} placeholder="Write something…" />
      );

    case "image":
      return (
        <div className="space-y-2">
          <Input value={p.url} onChange={(e) => set({ url: e.target.value })} placeholder="Image URL (https://…)" />
          <Input value={p.caption} onChange={(e) => set({ caption: e.target.value })} placeholder="Caption (optional)" />
        </div>
      );

    case "divider":
      return <p className="text-sm text-gray-400">A horizontal divider line.</p>;

    case "button":
      return (
        <div className="space-y-2">
          <Input value={p.label} onChange={(e) => set({ label: e.target.value })} placeholder="Button label" />
          <div className="flex gap-2">
            <select
              value={p.actionType}
              onChange={(e) => set({ actionType: e.target.value })}
              className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
            >
              <option value="link">Link</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
            <Input
              className="flex-1"
              value={p.value}
              onChange={(e) => set({ value: e.target.value })}
              placeholder={placeholderFor(p.actionType)}
            />
          </div>
          <Toggle
            value={p.style}
            onChange={(style) => set({ style })}
            options={[
              { value: "primary", label: "Filled" },
              { value: "outline", label: "Outline" },
            ]}
          />
          {p.actionType !== "link" && (
            <p className="text-xs text-amber-600">
              Heads up: this reveals your {p.actionType} to anyone who scans. Only add it if you’re happy to share it.
            </p>
          )}
        </div>
      );

    case "links":
      return (
        <ItemList
          items={p.items || []}
          onChange={(items) => set({ items })}
          empty={{ label: "", url: "" }}
          render={(item, update) => (
            <div className="flex-1 space-y-2">
              <Input value={item.label} onChange={(e) => update({ label: e.target.value })} placeholder="Label" />
              <Input value={item.url} onChange={(e) => update({ url: e.target.value })} placeholder="https://…" />
            </div>
          )}
          addLabel="+ Add link"
        />
      );

    case "socials":
      return (
        <ItemList
          items={p.items || []}
          onChange={(items) => set({ items })}
          empty={{ platform: "instagram", url: "" }}
          render={(item, update) => (
            <div className="flex flex-1 gap-2">
              <select
                value={item.platform}
                onChange={(e) => update({ platform: e.target.value })}
                className="rounded-xl border border-gray-300 px-2 py-2.5 text-sm"
              >
                {SOCIAL_PLATFORMS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.icon} {s.label}
                  </option>
                ))}
              </select>
              <Input className="flex-1" value={item.url} onChange={(e) => update({ url: e.target.value })} placeholder="URL" />
            </div>
          )}
          addLabel="+ Add social"
        />
      );

    case "finder_form":
      return (
        <Input value={p.heading} onChange={(e) => set({ heading: e.target.value })} placeholder="Form heading" />
      );

    case "reward":
      return (
        <div className="space-y-2">
          <Input value={p.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="Reward, e.g. ₹200" />
          <Input value={p.note} onChange={(e) => set({ note: e.target.value })} placeholder="Note (optional)" />
        </div>
      );

    case "note":
      return (
        <Textarea rows={3} value={p.text} onChange={(e) => set({ text: e.target.value })} placeholder="Your note to the finder" />
      );

    default:
      return null;
  }
}

function placeholderFor(actionType) {
  switch (actionType) {
    case "whatsapp":
      return "Phone incl. country code, e.g. 919000000000";
    case "email":
      return "you@example.com";
    case "phone":
      return "+91 90000 00000";
    default:
      return "https://…";
  }
}

// A segmented left/right toggle.
function Toggle({ value, onChange, options }) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            value === o.value ? "border-brand bg-brand-light text-brand" : "border-gray-300 text-gray-600"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// A reusable add/remove/reorder list used by the links + socials blocks.
function ItemList({ items, onChange, empty, render, addLabel }) {
  const update = (i, patch) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex flex-col pt-1 text-xs text-gray-400">
            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="hover:text-brand disabled:opacity-30">▲</button>
            <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="hover:text-brand disabled:opacity-30">▼</button>
          </div>
          {render(item, (patch) => update(i, patch))}
          <button type="button" onClick={() => remove(i)} className="pt-2 text-gray-400 hover:text-red-600">✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { ...empty }])} className="text-sm font-medium text-brand">
        {addLabel}
      </button>
    </div>
  );
}
