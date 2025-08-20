import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { health, generatePolicy } from './lib/api';

export default function App() {
  const hq = useQuery({ queryKey: ['health'], queryFn: health });
  const [topic, setTopic] = useState('');
  const mut = useMutation({ mutationFn: generatePolicy });

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>ESG Policy Generator</h1>
      <p>Health: {hq.isLoading ? 'checking…' : hq.isError ? 'down' : hq.data.status}</p>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <input
          placeholder="Enter ESG topic (e.g., Water Conservation)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={() => mut.mutate(topic)} disabled={!topic || mut.isPending}>
          {mut.isPending ? 'Generating…' : 'Generate'}
        </button>
      </div>

      {mut.isSuccess && (
        <pre style={{ background: '#f5f5f5', padding: 12, marginTop: 16 }}>
{JSON.stringify(mut.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
