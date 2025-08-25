// controllers/exportController.js
import { Policy } from '../models/policy.model.js';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Numbering, AlignmentType } from "docx";
import { launchBrowser } from "../lib/launchBrowser.js";

function renderBlocksToHtml(blocks) {
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

function policyHtmlTemplate({ topic, bodyHtml }) {
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



// exportPdfFromHtml
// async function exportPdfFromHtml(html, companyName = "KuKi Pvt Ltd") {
//   const browser = await puppeteer.launch();
//   try {
//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: ['domcontentloaded', 'networkidle0'] });

//     const pdf = await page.pdf({
//       format: 'A4',
//       printBackground: true,
//       displayHeaderFooter: true,
//       margin: { top: '84px', bottom: '84px', left: '60px', right: '60px' },
//       headerTemplate: `<div></div>`,
//       // Inline styles only; external CSS is ignored in header/footer
//       footerTemplate: `
//         <div style="font-size:10px;color:#666;width:100%;
//                     padding:0 12px;display:flex;justify-content:flex-end;align-items:center;">
//           <span style="font-weight:700;letter-spacing:.4px;">${escapeHtml(companyName)}</span>
//         </div>`
//     });

//     return pdf;
//   } finally {
//     await browser.close();
//   }
// }
// server/controllers/exportController.js

async function exportPdfFromHtml(html) {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: ["domcontentloaded", "networkidle0"] });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      margin: { top: "84px", bottom: "84px", left: "60px", right: "60px" },
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="font-size:10px;color:#666;width:100%;
                    padding:0 12px;display:flex;justify-content:flex-end;align-items:center;">
          <span style="font-weight:700;letter-spacing:.4px;">KuKi Pvt Ltd</span>
        </div>`
    });

    // ⬇️ Ensure Node Buffer (Uint8Array on Vercel)
    return Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}




function renderBlocksToDocxChildren(blocks) {
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

export const exportPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const format = String(req.query.format || req.body.format || '').toLowerCase();
    if (!['pdf', 'docx'].includes(format)) {
      return res.status(400).json({ error: "Invalid format. Use 'pdf' or 'docx'." });
    }

    const policy = await Policy.findById(id);
    if (!policy) return res.status(404).json({ error: 'Policy not found' });

    const topic = policy.topic || 'ESG Policy';
    const blocks = [...(policy.blocks || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (format === "pdf") {
      const html = policyHtmlTemplate({ topic, bodyHtml: renderBlocksToHtml(blocks) });
      const pdfBuffer = await exportPdfFromHtml(html);

      // Optional sanity check while debugging:

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${sanitizeFilename(topic)}.pdf"`);
      res.setHeader("Content-Length", String(pdfBuffer.length));
      res.setHeader("X-Content-Type-Options", "nosniff");
      return res.end(pdfBuffer);  // ⬅️ use end(), not send()
    }


    // DOCX
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { after: 240 },
              children: [new TextRun({ text: topic, bold: true, size: 48 })],
            }),
            ...renderBlocksToDocxChildren(blocks),
          ],
        },
      ],
    });
    const buffer = await Packer.toBuffer(doc);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(topic)}.docx"`);
    return res.send(buffer);
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ error: 'Failed to export policy' });
  }
};

function sanitizeFilename(name) {
  return String(name).replace(/[\\/:*?"<>|]+/g, '_');
}
