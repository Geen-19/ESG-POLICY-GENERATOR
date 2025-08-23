import { api } from "./client";
import axios, { Axios } from "axios";
const API = import.meta.env.VITE_API || '';
export async function generatePolicy(payload) {
  
  try {
    const { data } = await axios.post(`${API}/api/policies/generate`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return data;
  } catch (e) {
    console.error('generatePolicy failed:',
      e.response?.status,
      e.response?.data?.error || e.message
    );
    throw e;
  }
}

export async function fetchPolicy(id) {
  const { data } = await axios.get(`${API}/api/policies/${id}`);
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
  const { data } = await axios.put(`${API}/api/policies/${id}/blocks`, { blocks: normalized });
  return data; // expect { _id, blocks: [...] } or { ok: true }
}
