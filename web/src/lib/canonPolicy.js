// ../lib/canonPolicy.ts/js
function stripTags(s = "") {
  return String(s).replace(/<[^>]*>/g, "").trim();
}

export default function canonPolicy(p) {
  if (!p) return p;
  const blocks = (p.blocks ?? []).map((b, i) => {
    let type = String(b?.type ?? "").toLowerCase().trim();
    if (/^h[1-6]$/.test(type) || ["heading", "header", "title"].includes(type)) type = "heading";
    else if (["ul","ol","list"].includes(type)) type = "list";
    else if (!type) type = "paragraph";

    const order = Number.isFinite(b?.order) ? b.order : i + 1;

    if (type === "heading") {
      const title = (String(b.title ?? "").trim()) || stripTags(String(b.content ?? ""));
      const content = title; // <= ensure preview has text immediately
      return { ...b, type, title, content, order };
    }

    if (type === "list") {
      const content = Array.isArray(b.content)
        ? b.content
        : String(b.content ?? "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      return { ...b, type, content, order };
    }

    // paragraph
    const content = String(b.content ?? "");
    return { ...b, type: "paragraph", content, order };
  });

  return { ...p, blocks };
}
