// controllers/exportController.js
import { Policy } from '../models/policy.model.js';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Numbering, AlignmentType } from "docx";
import { launchBrowser } from "../lib/launchBrowser.js";
import policyHtmlTemplate from '../lib/pdfLibs/pdf.js';
import { renderBlocksToHtml } from '../lib/pdfLibs/pdf.js';
import { renderBlocksToDocxChildren } from '../lib/wordLibs/word.js';

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
