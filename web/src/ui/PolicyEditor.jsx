import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Trash2, GripVertical, Type, List as ListIcon, Pilcrow, ArrowUp, ArrowDown } from "lucide-react";
import BlockEditor from "./blocks/BlockEditor";
import React, { memo } from "react";
import { cid } from "../lib/id";
import cx from "classnames";

const MemoBlockShell = memo(BlockShell);
const MemoBlockEditor = memo(BlockEditor);
const TYPES = [
  { value: "paragraph", label: "Paragraph", icon: Pilcrow },
  { value: "heading", label: "Heading", icon: Type },
  { value: "list", label: "List", icon: ListIcon },
];

// GPU-friendly transform style for Draggable items
function getItemStyle(style, snapshot) {
  const transform = style?.transform;
  const translate =
    snapshot.isDragging && transform
      ? transform.replace(/translate\(([^)]+)\)/, "translate3d($1, 0)")
      : transform;
  return {
    ...style,
    transform: translate,
    transition: snapshot.isDragging ? "none" : "transform 180ms cubic-bezier(0.2,0,0,1)",
    willChange: "transform",
  };
}

export default function PolicyEditor({ policyId }) {
  const { data: policy } = useQuery({ queryKey: ["policy", policyId], enabled: !!policyId, staleTime: 0 });
  const qc = useQueryClient();

  const blocks = useMemo(() => {
    const arr = [...(policy?.blocks || [])];
    arr.sort((a, b) => {
      const ao = Number.isFinite(a.order) ? a.order : 1e9;
      const bo = Number.isFinite(b.order) ? b.order : 1e9;
      if (ao !== bo) return ao - bo;
      return String(a.id ?? "").localeCompare(String(b.id ?? ""));
    });
    return arr;
  }, [policy]);

  const setBlocks = (next) => {
    const prev = qc.getQueryData(["policy", policyId]);
    if (!prev) return;
    qc.setQueryData(["policy", policyId], { ...prev, blocks: next.map((b, i) => ({ ...b, order: i + 1 })) });
  };

  const updateBlock = (id, updater) => {
    const next = blocks.map((b) => (b.id === id ? { ...b, ...updater(b) } : b));
    setBlocks(next);
  };
  const addBlockAfter = (idx) => {
    const newBlock = { id: cid(), type: "paragraph", order: idx + 2, title: undefined, content: "" };
    const next = [...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)];
    setBlocks(next);
  };
  const deleteBlock = (id) => setBlocks(blocks.filter((b) => b.id !== id));
  function stripHeadingTags(html = "") {
    return String(html).replace(/<\/?h[1-6][^>]*>/gi, "");
  }

  function toPlainFromBlock(b) {
    // Prefer plain title (you already keep this up-to-date for headings)
    if (typeof b?.title === "string" && b.title.trim()) return b.title.trim();

    // Fallback: remove heading tags + block wrappers, normalize <br> to newline
    const raw = stripHeadingTags(String(b?.content ?? ""));
    return raw
      .replace(/<\/?p[^>]*>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")       // nuke any stray tags
      .trim();
  }

  const changeType = (id, nextType) => {
    const next = blocks.map((b) => {
      if (b.id !== id) return b;

      if (nextType === "list") {
        const base = toPlainFromBlock(b);
        const items = Array.isArray(b.content)
          ? b.content
          : base.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        return { ...b, type: "list", title: undefined, content: items };
      }

      if (nextType === "heading") {
        const text = toPlainFromBlock(b);
        // keep both title (plain) and content (TipTap will wrap to <h2>)
        return { ...b, type: "heading", title: text, content: text };
      }

      // paragraph
      const text = toPlainFromBlock(b);
      return { ...b, type: "paragraph", title: undefined, content: text };
    });

    setBlocks(next);
  };

  const moveBy = (id, delta) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const to = idx + delta;
    if (to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    const [it] = next.splice(idx, 1);
    next.splice(to, 0, it);
    setBlocks(next);
  };

  const onDragEnd = ({ destination, source }) => {
    if (!destination) return;
    if (destination.index === source.index) return;
    const next = [...blocks];
    const [moved] = next.splice(source.index, 1);
    next.splice(destination.index, 0, moved);
    setBlocks(next);
  };

  if (!policy) return null;

  return (
    <div className="pb-3" key={policyId}>
      <div className="px-4 py-2 text-xs text-zinc-500">Drag by the handle for smooth movement. Use ↑/↓ for keyboard reordering.</div>

      <DragDropContext
        onDragStart={() => document.body.classList.add("dnd-grabbing")}
        onDragEnd={(result) => {
          document.body.classList.remove("dnd-grabbing");
          const { destination, source } = result || {};
          if (!destination) return;
          if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
          ) return;
          const next = [...blocks];
          const [moved] = next.splice(source.index, 1);
          next.splice(destination.index, 0, moved);
          setBlocks(next);
        }}
      >
        <Droppable
          droppableId="policyBlocks"
          direction="vertical"
          // Lightweight drag preview rendered outside layout to avoid reflow
          renderClone={(provided, snapshot, rubric) => {
            const b =
              blocks.find(x => String(x.id) === rubric.draggableId) ??
              blocks[rubric.source.index];
            return (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={cx("dnd-clone px-3 py-2 border", "border-zinc-200 dark:border-zinc-700")}
                style={provided.draggableProps.style}
              >
                <ClonePreview block={b} />
              </div>
            );
          }}
        >
          {(drop) => (
            <div ref={drop.innerRef} {...drop.droppableProps}>
              {blocks.map((b, i) => (
                <Draggable
                  key={b.id}
                  draggableId={String(b.id)}
                  index={i}
                  disableInteractiveElementBlocking={true}
                  shouldRespectForcePress={false}
                >
                  {(drag, snapshot) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className={cx("relative dnd-item", snapshot.isDragging && "dnd-dragging")}
                      style={getItemStyle(drag.draggableProps.style, snapshot)}
                    >
                      <BlockShell

                        dragHandleProps={{ ...drag.dragHandleProps, className: "toolbar-btn dnd-handle" }}
                        index={i}
                        block={b}
                        onAdd={() => addBlockAfter(i)}
                        onDelete={() => deleteBlock(b.id)}
                        onTypeChange={(t) => changeType(b.id, t)}
                        onMoveUp={() => moveBy(b.id, -1)}
                        onMoveDown={() => moveBy(b.id, +1)}
                      >
                        {/* Keep the heavy TipTap editor static during drag */}
                        <div style={{ pointerEvents: snapshot.isDragging ? "none" : "auto" }}>
                          <BlockEditor
                            block={b}
                            onChange={(content, title) => {
                              updateBlock(b.id, () => ({ content, ...(title !== undefined ? { title } : {}) }));
                            }}
                          />
                        </div>
                      </BlockShell>
                    </div>
                  )}
                </Draggable>
              ))}
              {drop.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="px-4 py-3">
        <button className="toolbar-btn" onClick={() => addBlockAfter(blocks.length - 1)}>
          <Plus size={14} className="mr-1" /> Add block
        </button>
      </div>
    </div>
  );
}

/** Small, fast preview for the dragging clone */
function ClonePreview({ block }) {
  if (block.type === "heading") {
    return <div className="font-semibold">{block.title || block.content || "Heading"}</div>;
  }
  if (block.type === "list") {
    const items = Array.isArray(block.content) ? block.content : String(block.content || "").split("\n");
    return (
      <div>
        <div className="text-xs text-zinc-500 mb-1">List</div>
        <ul className="list-disc ml-5 text-sm">
          {items.filter(Boolean).slice(0, 5).map((t, i) => <li key={i}>{t}</li>)}
          {items.filter(Boolean).length > 5 && <li>…</li>}
        </ul>
      </div>
    );
  }
  const txt = Array.isArray(block.content) ? block.content.join(" · ") : String(block.content || "");
  return (
    <div>
      <div className="text-xs text-zinc-500 mb-1">Paragraph</div>
      <div className="text-sm line-clamp-3">{txt || "Paragraph"}</div>
    </div>
  );
}

/**  toolbar + drag handle */
function BlockShell({ children, dragHandleProps, block, onAdd, onDelete, onTypeChange, onMoveUp, onMoveDown }) {
  const TypeIcon = TYPES.find(t => t.value === block.type)?.icon ?? Pilcrow;
  return (
    <section className="grid grid-cols-[34px_1fr] gap-2 px-2">
      <div className="flex flex-col items-center pt-6">
        <button aria-label="Drag" title="Drag" {...dragHandleProps}>
          <GripVertical size={16} />
        </button>
        <div className="h-2" />
        <button className="toolbar-btn" onClick={onMoveUp} aria-label="Move up"><ArrowUp size={14} /></button>
        <div className="h-1" />
        <button className="toolbar-btn" onClick={onMoveDown} aria-label="Move down"><ArrowDown size={14} /></button>
      </div>

      <div className="my-2">
        <div className="flex items-center justify-between px-2">
          <div className="inline-flex items-center gap-2 text-[11px] md:text-xs font-medium rounded-full px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <TypeIcon size={14} />
            {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
          </div>

          <div className="flex items-center gap-2">
            <TypeSwitch value={block.type} onChange={onTypeChange} />

            <button className="toolbar-btn" onClick={onAdd} aria-label="Add block after"><Plus size={14} /></button>
            <button className="toolbar-btn" onClick={onDelete} aria-label="Delete block"><Trash2 size={14} /></button>
          </div>
        </div>

        <div className="mt-2">{children}</div>
      </div>
    </section>
  );
}


import { useCallback } from "react";
// ...

function TypeSwitch({ value, onChange }) {
  const items = [
    { value: "heading", label: "Heading", icon: Type },
    { value: "paragraph", label: "Paragraph", icon: Pilcrow },
    { value: "list", label: "List", icon: ListIcon },
  ];

  const handleKey = useCallback((e) => {
    const order = ["heading", "paragraph", "list"];
    const i = order.indexOf(value);
    if (i === -1) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onChange(order[(i + 1) % order.length]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onChange(order[(i + order.length - 1) % order.length]);
    }
  }, [value, onChange]);

  return (
    <div
      role="tablist"
      aria-label="Block type"
      onKeyDown={handleKey}
      className="inline-flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm"
    >
      {items.map(({ value: v, label, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            role="tab"
            aria-selected={active}
            className={
              "px-3 py-1.5 text-sm inline-flex items-center gap-2 rounded-xl " +
              (active
                ? "bg-black text-white"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800")
            }
            onClick={() => onChange(v)}
          >
            <Icon size={16} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
