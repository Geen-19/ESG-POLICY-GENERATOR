const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export async function health() {
  const res = await fetch(`${API}/health`);
  if (!res.ok) throw new Error('Health failed');
  return res.json();
}

export async function generatePolicy(topic) {
  const res = await fetch(`${API}/api/policies/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic })
  });
  if (!res.ok) throw new Error('Generate failed');
  return res.json();
}
