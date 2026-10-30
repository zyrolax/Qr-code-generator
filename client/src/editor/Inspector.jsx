// The contextual editing panel. It shows ONLY the controls relevant to the
// current selection — one element at a time — or page-wide settings when
// nothing is selected. Edits flow up via onChange(nextProps) / onStyleChange.
import { SOCIAL_PLATFORMS, BLOCK_META } from "../blocks/registry.js";
import {
  FONT_OPTIONS, WEIGHT_OPTIONS, HEADING_SIZE_OPTIONS, TEXT_SIZE_OPTIONS,
  ALIGN_OPTIONS, LEADING_OPTIONS, RADIUS_OPTIONS,
} from "../blocks/styleTokens.js";
import { THEMES } from "../blocks/themes.js";
import { Field, Segmented, ColorSwatches, ToggleSwitch, TextInput, TextAreaInput, PanelButton } from "./controls.jsx";

export function Inspector({ block, onChange, onEditImage, style, onStyleChange }) {
  if (!block) return <PageSettings style={style} onStyleChange={onStyleChange} />;

  const meta = BLOCK_META[block.type];
  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-ink">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-ink/5 text-sm">{meta?.icon}</span>
        <h3 className="font-semibold">{meta?.label || block.type}</h3>
      </div>
      <BlockControls block={block} onChange={onChange} onEditImage={onEditImage} />
    </div>
  );
}

function BlockControls({ block, onChange, onEditImage }) {
  const p = block.props || {};
  const set = (patch) => onChange({ ...p, ...patch });

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-4">
          <Field label="Text">
            <TextAreaInput rows={2} value={p.text} onChange={(e) => set({ text: e.target.value })} placeholder="Heading" />
          </Field>
          <Field label="Font"><Segmented value={p.font ?? ""} onChange={(font) => set({ font })} options={FONT_OPTIONS} /></Field>
          <Field label="Weight"><Segmented value={p.weight} onChange={(weight) => set({ weight })} options={WEIGHT_OPTIONS} /></Field>
          <Field label="Size"><Segmented value={p.size} onChange={(size) => set({ size })} options={HEADING_SIZE_OPTIONS} /></Field>
          <Field label="Alignment"><Segmented value={p.align} onChange={(align) => set({ align })} options={ALIGN_OPTIONS} /></Field>
          <Field label="Colour"><ColorSwatches value={p.color} onChange={(color) => set({ color })} /></Field>
        </div>
      );

    case "text":
      return (
        <div className="space-y-4">
          <Field label="Text">
            <TextAreaInput rows={5} value={p.text} onChange={(e) => set({ text: e.target.value })} placeholder="Write something…" />
          </Field>
          <Field label="Font"><Segmented value={p.font ?? ""} onChange={(font) => set({ font })} options={FONT_OPTIONS} /></Field>
          <Field label="Size"><Segmented value={p.size} onChange={(size) => set({ size })} options={TEXT_SIZE_OPTIONS} /></Field>
          <Field label="Alignment"><Segmented value={p.align} onChange={(align) => set({ align })} options={ALIGN_OPTIONS} /></Field>
          <Field label="Line spacing"><Segmented value={p.leading} onChange={(leading) => set({ leading })} options={LEADING_OPTIONS} /></Field>
          <Field label="Colour"><ColorSwatches value={p.color} onChange={(color) => set({ color })} /></Field>
        </div>
      );

    case "image":
      return (
        <div className="space-y-4">
          <Field label="Photo">
            <PanelButton className="w-full" onClick={onEditImage}>
              {p.url ? "Replace / crop photo" : "Upload a photo"}
            </PanelButton>
          </Field>
          {p.url && (
            <>
              <Field label="Fit"><Segmented value={p.fit} onChange={(fit) => set({ fit })} options={[{ value: "cover", label: "Fill" }, { value: "contain", label: "Fit" }]} /></Field>
              <Field label="Corners"><Segmented value={p.radius} onChange={(radius) => set({ radius })} options={RADIUS_OPTIONS} /></Field>
              {p.fit !== "contain" && (
                <Field label="Position" hint="Nudge which part of the photo shows">
                  <div className="space-y-2">
                    <Slider label="↔" value={p.focalX ?? 50} onChange={(focalX) => set({ focalX })} />
                    <Slider label="↕" value={p.focalY ?? 50} onChange={(focalY) => set({ focalY })} />
                  </div>
                </Field>
              )}
            </>
          )}
          <Field label="Caption">
            <TextInput value={p.caption} onChange={(e) => set({ caption: e.target.value })} placeholder="Optional caption" />
          </Field>
        </div>
      );

    case "button":
      return (
        <div className="space-y-4">
          <Field label="Label"><TextInput value={p.label} onChange={(e) => set({ label: e.target.value })} placeholder="Button label" /></Field>
          <Field label="Action">
            <div className="flex gap-2">
              <Select value={p.actionType} onChange={(v) => set({ actionType: v })} options={[
                { value: "link", label: "Link" }, { value: "whatsapp", label: "WhatsApp" },
                { value: "email", label: "Email" }, { value: "phone", label: "Phone" },
              ]} />
              <TextInput className="flex-1" value={p.value} onChange={(e) => set({ value: e.target.value })} placeholder={placeholderFor(p.actionType)} />
            </div>
          </Field>
          {p.actionType !== "link" && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              This reveals your {p.actionType} to anyone who scans. Only add it if you’re happy to share it.
            </p>
          )}
          <Field label="Style"><Segmented value={p.style} onChange={(style) => set({ style })} options={[{ value: "primary", label: "Filled" }, { value: "outline", label: "Outline" }]} /></Field>
          <Field label="Alignment"><Segmented value={p.align} onChange={(align) => set({ align })} options={ALIGN_OPTIONS} /></Field>
          <Field label="Button colour"><ColorSwatches value={p.color} onChange={(color) => set({ color })} /></Field>
          <ToggleSwitch value={p.fullWidth !== false} onChange={(v) => set({ fullWidth: v })} label="Full width" />
        </div>
      );

    case "links":
      return (
        <ItemList
          items={p.items || []} onChange={(items) => set({ items })} empty={{ label: "", url: "" }} addLabel="Add link"
          render={(item, update) => (
            <div className="flex-1 space-y-2">
              <TextInput value={item.label} onChange={(e) => update({ label: e.target.value })} placeholder="Label" />
              <TextInput value={item.url} onChange={(e) => update({ url: e.target.value })} placeholder="https://…" />
            </div>
          )}
        />
      );

    case "socials":
      return (
        <ItemList
          items={p.items || []} onChange={(items) => set({ items })} empty={{ platform: "instagram", url: "" }} addLabel="Add social"
          render={(item, update) => (
            <div className="flex-1 space-y-2">
              <Select value={item.platform} onChange={(v) => update({ platform: v })}
                options={SOCIAL_PLATFORMS.map((s) => ({ value: s.key, label: `${s.icon} ${s.label}` }))} />
              <TextInput value={item.url} onChange={(e) => update({ url: e.target.value })} placeholder="Profile URL" />
            </div>
          )}
        />
      );

    case "contact":
      return (
        <>
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Anything here is shown to anyone who scans. Only add details you’re happy to share.
          </p>
          <ItemList
            items={p.items || []} onChange={(items) => set({ items })} empty={{ kind: "phone", label: "", value: "" }} addLabel="Add detail"
            render={(item, update) => (
              <div className="flex-1 space-y-2">
                <Select value={item.kind} onChange={(v) => update({ kind: v })} options={[
                  { value: "phone", label: "📞 Phone" }, { value: "email", label: "✉️ Email" },
                  { value: "address", label: "📍 Address" }, { value: "website", label: "🌐 Website" },
                  { value: "custom", label: "• Other" },
                ]} />
                <TextInput value={item.value} onChange={(e) => update({ value: e.target.value })} placeholder="Value" />
                <TextInput value={item.label} onChange={(e) => update({ label: e.target.value })} placeholder="Label (optional)" />
              </div>
            )}
          />
        </>
      );

    case "finder_form":
      return (
        <Field label="Form heading">
          <TextInput value={p.heading} onChange={(e) => set({ heading: e.target.value })} placeholder="Found this item?" />
        </Field>
      );

    case "reward":
      return (
        <div className="space-y-4">
          <Field label="Reward"><TextInput value={p.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="e.g. ₹200" /></Field>
          <Field label="Note"><TextInput value={p.note} onChange={(e) => set({ note: e.target.value })} placeholder="Optional" /></Field>
        </div>
      );

    case "note":
      return (
        <Field label="Your note">
          <TextAreaInput rows={4} value={p.text} onChange={(e) => set({ text: e.target.value })} placeholder="Your note to the finder" />
        </Field>
      );

    case "divider":
      return (
        <Field label="Style">
          <Segmented value={p.variant} onChange={(variant) => set({ variant })} options={[
            { value: "line", label: "Line" }, { value: "dots", label: "Dots" }, { value: "space", label: "Space" },
          ]} />
        </Field>
      );

    default:
      return null;
  }
}

// --- page-wide settings (shown when nothing is selected) -------------------
function PageSettings({ style = {}, onStyleChange }) {
  const set = (patch) => onStyleChange({ ...style, ...patch });
  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-ink">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-ink/5 text-sm">◫</span>
        <h3 className="font-semibold">Page style</h3>
      </div>
      <div className="space-y-5">
        <Field label="Theme" hint="Switching keeps all your content">
          <div className="grid grid-cols-5 gap-2">
            {THEMES.map((t) => {
              const active = (style.theme || "warm") === t.id;
              return (
                <button
                  key={t.id} type="button" title={t.name} onClick={() => set({ theme: t.id })}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-1.5 transition ${active ? "border-ink" : "border-ink/10 hover:border-ink/30"}`}
                >
                  <span className="relative h-8 w-full overflow-hidden rounded" style={{ background: t.pageBg }}>
                    <span className="absolute inset-x-1 bottom-1 top-2 rounded-sm" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }} />
                    <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ background: t.accent }} />
                  </span>
                  <span className="text-[10px] text-ink/60">{t.name}</span>
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Base font"><Segmented value={style.font ?? ""} onChange={(font) => set({ font })} options={FONT_OPTIONS} /></Field>
        <Field label="Background" hint="Override the theme background">
          <ColorSwatches value={style.background} onChange={(background) => set({ background })} />
        </Field>
        <Field label="Accent" hint="Buttons, links and highlights">
          <ColorSwatches value={style.accent} onChange={(accent) => set({ accent })} />
        </Field>
      </div>
    </div>
  );
}

// --- shared helpers --------------------------------------------------------
function Slider({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-center text-xs text-ink/40">{label}</span>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-clay" />
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-ink/15 bg-white px-2 py-2 text-sm text-ink outline-none focus:border-ink/40"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function placeholderFor(actionType) {
  switch (actionType) {
    case "whatsapp": return "Phone incl. country code";
    case "email": return "you@example.com";
    case "phone": return "+91 90000 00000";
    default: return "https://…";
  }
}

// Add/remove/reorder list for links / socials / contact items.
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
        <div key={i} className="flex items-start gap-2 rounded-lg border border-ink/10 bg-white p-2">
          <div className="flex flex-col pt-1 text-xs text-ink/35">
            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="hover:text-ink disabled:opacity-30">▲</button>
            <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="hover:text-ink disabled:opacity-30">▼</button>
          </div>
          {render(item, (patch) => update(i, patch))}
          <button type="button" onClick={() => remove(i)} className="pt-1 text-ink/35 hover:text-red-600">✕</button>
        </div>
      ))}
      <PanelButton className="w-full" onClick={() => onChange([...items, { ...empty }])}>+ {addLabel}</PanelButton>
    </div>
  );
}
