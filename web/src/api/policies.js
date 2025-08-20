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
  const { data } = await api.put(`/policies/${id}/blocks`, { blocks });
  return data;
}
