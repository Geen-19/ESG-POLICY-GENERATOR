// controllers/exportController.js
import { Policy } from '../models/policy.model.js';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Numbering, AlignmentType } from "docx";
import { launchBrowser } from "../lib/launchBrowser.js";

function renderBlocksToHtml(blocks) {
  // Simple, consistent HTML from the canonical blocks
  const parts = blocks.map(b => {
    if (b.type === 'heading') {
      const t = b.title || b.content;
      return `<h2>${escapeHtml(t)}</h2>`;
    }
    if (b.type === 'list') {
      const items = Array.isArray(b.content) ? b.content : String(b.content || '').split('\n').filter(Boolean);
      return `<ul>${items.map(li => `<li>${escapeHtml(li)}</li>`).join('')}</ul>`;
    }
    // paragraph (fallback)
    return `<p>${escapeHtml(String(b.content ?? ''))}</p>`;
  });

  return parts.join('\n');
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
  const children = [];
  blocks.forEach(b => {
    if (b.type === 'heading') {
      const t = (b.title || b.content || '').toString();
      children.push(new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { after: 140 } }));
    } else if (b.type === 'list') {
      const items = Array.isArray(b.content) ? b.content : String(b.content || '').split('\n').filter(Boolean);
      items.forEach((li) => {
        children.push(new Paragraph({
          text: li,
          bullet: { level: 0 },
          spacing: { after: 80 }
        }));
      });
    } else {
      const text = (b.content || '').toString();
      children.push(new Paragraph({ children: [new TextRun(text)] }));
    }
  });
  return children;
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
      // console.log('PDF header:', pdfBuffer.slice(0,5).toString()); // should be "%PDF-"

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
