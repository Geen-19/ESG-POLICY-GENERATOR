import { useMemo, useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import cx from "classnames";

export default function BlockEditor({ block, onChange }) {
  const isHeading = block.type === "heading";
  const isPara = block.type === "paragraph";
  const isList = block.type === "list";

  const initialText = useMemo(() => {
    if (isHeading) return String(block.title ?? block.content ?? "");
    if (isPara)   return String(block.content ?? "");
    return Array.isArray(block.content) ? block.content.join("\n") : String(block.content ?? "");
  }, [block.id, block.type]); // ⬅️ only re-derive when identity/type changes

  // Flag to ignore TipTap onUpdate while we're injecting content
  const isApplyingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Heading.configure({ levels: [2] }),
      Bold, Italic,
      BulletList, ListItem,
    ],
    content: isList ? toListHtml(initialText) : toParagraphHtml(initialText, isHeading),
    autofocus: false,
    onUpdate: ({ editor }) => {
      if (isApplyingRef.current) return; // ⬅️ prevent feedback loop
      if (isList) {
        const items = fromListHtml(editor.getHTML());
        onChange(items, undefined);
      } else if (isHeading) {
        const txt = editor.getText({ blockSeparator: "\n" }).trimEnd();
        onChange(txt, txt);
      } else {
        const txt = editor.getText({ blockSeparator: "\n" }).trimEnd();
        onChange(txt, undefined);
      }
    },
    editorProps: {
      attributes: { class: cx("min-h-[52px] w-full px-4 py-3 outline-none") },
    },
  });

  // Only push new content into TipTap when the block *identity/type* changes
  useEffect(() => {
    if (!editor) return;
    const html = isList ? toListHtml(initialText) : toParagraphHtml(initialText, isHeading);

    // ⚠️ Only set if different to avoid unnecessary transactions
    const current = editor.getHTML();
    if (normalizeHtml(current) !== normalizeHtml(html)) {
      isApplyingRef.current = true;
      editor.commands.setContent(html, false, { preserveWhitespace: "full" });
      // release the guard on next tick
      setTimeout(() => { isApplyingRef.current = false; }, 0);
    }
  }, [editor, block.id, block.type]); // ⬅️ NOT on text every keystroke

  return (
    <div className="group">
      <div className="flex items-center justify-between px-3 py-2 bg-white sticky top-[56px] z-[1] border-b">
        <div className="text-xs text-gray-500 uppercase">
          {isHeading ? "Heading" : isPara ? "Paragraph" : "List"}
        </div>
        <Toolbar editor={editor} showBullets={isPara || isList} />
      </div>

      <EditorContent editor={editor} />

      <div className="h-px bg-gray-100" />
    </div>
  );
}

function Toolbar({ editor, showBullets }) {
  if (!editor) return null;
  return (
    <div className="flex gap-1">
      <button type="button" className={btn(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
      <button type="button" className={btn(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button>
      {showBullets && (
        <button type="button" className={btn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>• • •</button>
      )}
    </div>
  );
}

function btn(active) {
  return cx("text-xs rounded px-2 py-1 border",
    active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50");
}

/* helpers */
function toParagraphHtml(text, isHeading) {
  const tag = isHeading ? "h2" : "p";
  const safe = escapeHtml(text ?? "");
  return `<${tag}>${safe.replace(/\n/g, "<br/>")}</${tag}>`;
}
function toListHtml(text) {
  const items = (text ?? "").split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(escapeHtml);
  return `<ul>${items.map(t => `<li>${t}</li>`).join("")}</ul>`;
}
function fromListHtml(html) {
  const matches = [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)];
  return matches.map(m => unescapeHtml(m[1] || "").replace(/<br\s*\/?>/g, "\n"));
}
function escapeHtml(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function unescapeHtml(s){return String(s).replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");}
function normalizeHtml(s){return String(s).replace(/\s+/g," ").trim();}
