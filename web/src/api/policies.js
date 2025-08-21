import { api } from "./client";

export async function generatePolicy(topic) {
  const { data } = await api.post("/policies/generate", { topic });
  return data; // { _id, topic, blocks: [...] }
}

export async function fetchPolicy(id) {
  const { data } = await api.get(`/policies/${id}`);
  return data;
}

export async function saveBlocks(id, blocks) {
  // Ensure order is contiguous 1..N before sending
  const normalized = blocks
    .map((b, i) => ({ ...b, order: i + 1 }))
    .map((b) => ({
      id: b.id, type: b.type, order: b.order,
      // keep title for heading; backend may store both
      title: b.title,
      content: b.type === "list"
        ? (Array.isArray(b.content) ? b.content : String(b.content ?? "").split(/\r?\n/).filter(Boolean))
        : (b.title && b.type === "heading" ? b.title : String(b.content ?? "")),
    }));
  const { data } = await api.put(`/api/policies/${id}/blocks`, { blocks: normalized });
  return data; // expect { _id, blocks: [...] } or { ok: true }
}
