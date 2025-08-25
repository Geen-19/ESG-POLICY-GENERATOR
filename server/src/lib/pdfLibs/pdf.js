export default function policyHtmlTemplate({ topic, bodyHtml }) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(topic)}</title>
<style>
  @page { margin: 84px 60px 84px 60px; }

  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #111; line-height: 1.45; font-size: 12pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Header/footer live in the page margin, won't overlap content */
  header, footer {
    position: fixed;
    left: 60px; right: 60px;
    height: 24px;
    color: #666;
  }
  header { top: 24px; }
  footer { bottom: 24px; text-align: right; } /* ⟵ bottom-right */

  h1 { font-size: 22pt; margin: 0 0 12px; }
  h2 { font-size: 14pt; margin: 18px 0 6px; }
  p  { margin: 8px 0; }
  ul { margin: 6px 0 6px 20px; }
  .brand { font-weight: 700; letter-spacing: .4px; }
</style>
</head>
<body>
  <header></header>

  <main>
    <h1>${escapeHtml(topic)}</h1>
    ${bodyHtml}
  </main>
</body>
</html>`;
}
function ensureBlockTag(html, tag) {
  const t = tag.toLowerCase(), h = String(html).trim();
  return new RegExp(`^<${t}\\b[\\s\\S]*</${t}>$`, "i").test(h) ? h : `<${t}>${h}</${t}>`;
}

function escapeHtml(s = '') {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
export function renderBlocksToHtml(blocks) {
  const parts = blocks.map(b => {
    if (b.type === 'heading') {
      const inline = extractInlineOnly(String(b.content ?? b.title ?? ""));
      return `<h2>${inline || ""}</h2>`;
    }
    if (b.type === 'list') {
      const items = Array.isArray(b.content)
        ? b.content
        : String(b.content || '').split('\n').filter(Boolean);
      return `<ul>${items.map(li => `<li>${allowInlineMarks(li)}</li>`).join('')}</ul>`;
    }
    const html = allowInlineMarks(String(b.content ?? ''));
    return ensureBlockTag(html, "p");
  });
  return parts.join("\n");
}
function extractInlineOnly(html = "") {
  // sanitize + drop block wrappers, keep <strong>/<em>/<br>
  let s = allowInlineMarks(html);
  s = s.replace(/<\/?(p|h[1-6]|ul|ol|li)[^>]*>/gi, "");
  return s.trim();
}

function allowInlineMarks(html = "") {
  let s = String(html);
  s = s.replace(/<\s*b(\s|>)/gi, "<strong$1").replace(/<\/\s*b\s*>/gi, "</strong>");
  s = s.replace(/<\s*i(\s|>)/gi, "<em$1").replace(/<\/\s*i\s*>/gi, "</em>");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/\son\w+="[^"]*"/gi, "");
  // allow only p, h2, br, strong, em, ul, li
  s = s.replace(/<(?!\/?(p|h2|br|strong|em|ul|li)\b)[^>]*>/gi, "");
  return s;
}