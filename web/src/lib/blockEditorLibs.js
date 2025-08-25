
export function stripHeadingTags(html = "") {
  return String(html).replace(/<\/?h[1-6][^>]*>/gi, "");
}
/* helpers */
export function toParagraphHtml(text, isHeading) {
  const tag = isHeading ? "h2" : "p";
  if (isHtml(text)) {
    const cleaned = isHeading ? text : stripHeadingTags(text);
    return ensureWrapped(sanitizeInline(cleaned), tag);
  }
  const safe = escapeHtml(text ?? "");
  return `<${tag}>${safe.replace(/\n/g, "<br/>")}</${tag}>`;
}

export function toListHtml(input) {
  const items = Array.isArray(input)
    ? input
    : String(input ?? "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  return `<ul>${items.map(t => {
    const htmlLike = isHtml(t);
    const cleaned = htmlLike
      ? sanitizeInline(stripHeadingTags(t))
      : escapeHtml(String(t)).replace(/\n/g, "<br/>");
    return `<li>${cleaned}</li>`;
  }).join("")}</ul>`;
}

export function fromListHtmlPreserveMarks(html) {
  const matches = [...String(html).matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  return matches
    .map(m => sanitizeInline(m[1] || "").trim())
    .filter(Boolean);
}
export function escapeHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
export function normalizeHtml(s) { return String(s).replace(/\s+/g, " ").trim(); }


export function sanitizeInline(html = "") {
  let s = String(html);
  s = s.replace(/<\s*b(\s|>)/gi, "<strong$1").replace(/<\/\s*b\s*>/gi, "</strong>");
  s = s.replace(/<\s*i(\s|>)/gi, "<em$1").replace(/<\/\s*i\s*>/gi, "</em>");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/\son\w+="[^"]*"/gi, "");
  // allow only: p, h2, br, strong, em, ul, li
  s = s.replace(/<(?!\/?(p|h2|br|strong|em|ul|li)\b)[^>]*>/gi, "");
  return s;
}
export const isHtml = (s) => /<[^>]+>/.test(String(s));
export const ensureWrapped = (html, tag) => {
  const t = tag.toLowerCase(), h = String(html).trim();
  return new RegExp(`^<${t}\\b[\\s\\S]*</${t}>$`, "i").test(h) ? h : `<${t}>${h}</${t}>`;
};