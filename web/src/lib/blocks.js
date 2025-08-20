/**
 * @typedef {"heading"|"paragraph"|"list"} BlockType
 * @typedef {{ id: string, type: BlockType, title?: string, order?: number, content: string | string[] }} Block
 */

export function blocksToPlainText(blocks) {
  return blocks
    .sort((a,b) => (a.order ?? 0) - (b.order ?? 0))
    .map(b => {
      if (b.type === "heading") return (b.title || b.content || "").toString().trim();
      if (b.type === "list") return (b.content || []).join("\n");
      return (b.content || "").toString();
    })
    .join("\n\n")
    .trim();
}

export function getCounts(blocks) {
  const text = blocksToPlainText(blocks);
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { words, chars };
}
