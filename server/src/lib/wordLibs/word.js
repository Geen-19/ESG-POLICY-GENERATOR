import { Document, Packer, Paragraph, HeadingLevel, TextRun, Numbering, AlignmentType } from "docx";

export function renderBlocksToDocxChildren(blocks) {
  // Build docx children honoring headings/lists/paragraphs
  const out = [];
  for (const b of blocks) {
    if (b.type === "heading") {
      const runs = htmlToRuns(b.content ?? b.title ?? "");
      out.push(new Paragraph({
        children: runs,
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 140 }
      }));
      continue;
    }
    if (b.type === "list") {
      const items = Array.isArray(b.content)
        ? b.content
        : String(b.content || "").split("\n").map(s => s.trim()).filter(Boolean);
      for (const li of items) {
        out.push(new Paragraph({
          children: htmlToRuns(li),
          bullet: { level: 0 },
          spacing: { after: 80 }
        }));
      }
      continue;
    }
    // paragraph
    out.push(new Paragraph({
      children: htmlToRuns(b.content || "")
    }));
  }
  return out;
}
function htmlToRuns(input = "") {
  // 1) keep only allowed inline tags
  let s = extractInlineOnly(input);
  // 2) normalize <b>/<i>, convert <br> to '\n'
  s = s
    .replace(/<\s*b(\s|>)/gi, "<strong$1").replace(/<\/\s*b\s*>/gi, "</strong>")
    .replace(/<\s*i(\s|>)/gi, "<em$1").replace(/<\/\s*i\s*>/gi, "</em>")
    .replace(/<br\s*\/?>/gi, "\n");

  // 3) tokenize by our small set of tags
  const tokens = s.split(/(<\/?strong>|<\/?em>)/i);
  let bold = false, italics = false;
  const runs = [];

  for (const tok of tokens) {
    const t = tok.toLowerCase();
    if (t === "<strong>") { bold = true; continue; }
    if (t === "</strong>") { bold = false; continue; }
    if (t === "<em>")     { italics = true; continue; }
    if (t === "</em>")    { italics = false; continue; }

    // Text node: honor line breaks as DOCX breaks
    const parts = tok.split("\n");
    parts.forEach((segment, idx) => {
      if (segment) runs.push(new TextRun({ text: segment, bold, italics }));
      if (idx < parts.length - 1) runs.push(new TextRun({ break: 1 }));
    });
  }
  return runs.length ? runs : [new TextRun("")];
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