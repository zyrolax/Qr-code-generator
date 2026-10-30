// The editing canvas: a realistic mobile page that IS the editing surface.
// Click a block to select it; drag the handle to reorder; edit headings and
// paragraphs inline; click an image to replace it. Everything renders through
// the shared BlockView/PageShell so the canvas matches the published page.
import { useEffect, useRef } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BlockView, PageShell, ContentCard, headingClasses, textClasses } from "../blocks/BlockView.jsx";

export function Canvas({ blocks, style, selectedId, status, onSelect, onReorder, onChangeBlock, onEditImage, onAddFirst }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragEnd(e) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const from = blocks.findIndex((b) => b.id === active.id);
      const to = blocks.findIndex((b) => b.id === over.id);
      onReorder(arrayMove(blocks, from, to));
    }
  }

  return (
    <div className="mx-auto w-full max-w-[380px]">
      {/* Phone frame */}
      <div className="overflow-hidden rounded-[2.2rem] border-[10px] border-ink/85 bg-ink/85 shadow-2xl shadow-ink/20">
        <PageShell style={style} className="max-h-[640px] min-h-[560px] overflow-y-auto px-3 py-4">
          {status === "lost" && (
            <div className="mb-3 rounded-lg bg-red-600 px-3 py-2 text-center text-xs font-semibold text-white">
              🔴 This item is reported lost
            </div>
          )}
          <ContentCard className="!p-4">
            {blocks.length === 0 ? (
              <button
                type="button"
                onClick={onAddFirst}
                className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed py-14 text-sm"
                style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
              >
                <span className="text-2xl">＋</span>
                Your page is empty — add your first element
              </button>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {blocks.map((block) => (
                      <SortableBlock
                        key={block.id}
                        block={block}
                        selected={block.id === selectedId}
                        onSelect={() => onSelect(block.id)}
                        onChange={onChangeBlock}
                        onEditImage={() => onEditImage(block.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </ContentCard>
        </PageShell>
      </div>
      <p className="mt-3 text-center text-xs text-ink/40">Tap an element to edit it · drag ⠿ to reorder</p>
    </div>
  );
}

function SortableBlock({ block, selected, onSelect, onChange, onEditImage }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const wrapStyle = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  const editable = block.type === "heading" || block.type === "text";

  return (
    <div
      ref={setNodeRef}
      style={wrapStyle}
      onMouseDown={onSelect}
      className={`group relative rounded-lg transition ${
        selected ? "outline outline-2 outline-offset-2 outline-clay" : "hover:outline hover:outline-1 hover:outline-offset-2 hover:outline-clay/40"
      }`}
    >
      {/* Hover/selected toolbar */}
      <div className={`absolute -top-2.5 right-1 z-10 flex items-center gap-1 transition ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
        <button
          type="button"
          {...attributes}
          {...listeners}
          onMouseDown={(e) => e.stopPropagation()}
          className="cursor-grab rounded-md bg-ink px-1.5 py-0.5 text-xs text-white active:cursor-grabbing"
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >⠿</button>
      </div>

      <div className="p-1">
        {editable ? (
          <InlineEditable block={block} onChange={onChange} onFocus={onSelect} />
        ) : block.type === "image" ? (
          <ImageSlot block={block} onEditImage={onEditImage} />
        ) : (
          <BlockView block={block} interactive={false} />
        )}
      </div>
    </div>
  );
}

// Heading / paragraph edited directly in place. Uncontrolled contentEditable so
// the caret never jumps; we only push text outward on input and only sync text
// inward when the element isn't focused (e.g. after undo).
function InlineEditable({ block, onChange, onFocus }) {
  const ref = useRef(null);
  const p = block.props || {};
  const isHeading = block.type === "heading";
  const value = p.text || "";

  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) {
      el.textContent = value;
    }
  }, [value]);

  const className = isHeading ? headingClasses(p) : `whitespace-pre-line ${textClasses(p)}`;
  const style = p.color ? { color: p.color } : isHeading ? undefined : { color: "var(--muted)" };

  const Tag = isHeading ? "h2" : "p";
  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={isHeading ? "Heading" : "Write something…"}
      onFocus={onFocus}
      onInput={(e) => onChange(block.id, { ...p, text: e.currentTarget.textContent }, { tag: `text:${block.id}` })}
      className={`${className} outline-none`}
      style={style}
    />
  );
}

// Image block in the canvas: shows the current image (or a prompt) and opens
// the upload/crop modal on click.
function ImageSlot({ block, onEditImage }) {
  return (
    <button type="button" onClick={onEditImage} className="block w-full text-left" title="Replace image">
      <BlockView block={block} interactive={false} />
    </button>
  );
}
