// web/src/lib/policyClipboard.js
export function blocksToHtml(blocks, topic) {
  const head = `<h1 style="font-size:20px;margin:0 0 12px">${escape(topic)}</h1>`;
  const body = blocks.map(b => {
    if (b.type === 'heading') {
      const t = b.title || b.content || '';
      return `<h2 style="font-size:16px;margin:16px 0 8px">${escape(t)}</h2>`;
    }
    if (b.type === 'list') {
      const items = Array.isArray(b.content) ? b.content : String(b.content || '').split('\n').filter(Boolean);
      return `<ul style="margin:8px 0 8px 20px">${items.map(li => `<li>${escape(li)}</li>`).join('')}</ul>`;
    }
    return `<p style="margin:6px 0">${escape(String(b.content ?? ''))}</p>`;
  }).join('\n');
  return head + body;
}

export function blocksToPlaintext(blocks, topic) {
  const lines = [topic.toUpperCase(), ''];
  blocks.forEach(b => {
    if (b.type === 'heading') {
      lines.push((b.title || b.content || '').toString());
    } else if (b.type === 'list') {
      const items = Array.isArray(b.content) ? b.content : String(b.content || '').split('\n').filter(Boolean);
      items.forEach(li => lines.push(`• ${li}`));
    } else {
      lines.push((b.content || '').toString());
    }
  });
  return lines.join('\n');
}

export async function copyPolicyToClipboard(blocks, topic='ESG Policy') {
  const html = blocksToHtml(blocks, topic);
  const text = blocksToPlaintext(blocks, topic);

  // Prefer rich clipboard if supported
  if (navigator.clipboard && window.ClipboardItem) {
    const item = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' }),
    });
    await navigator.clipboard.write([item]);
  } else {
    await navigator.clipboard.writeText(text);
  }
}

function escape(s='') {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
