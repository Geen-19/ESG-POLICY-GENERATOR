import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { health, generatePolicy } from './lib/api';
import GeneratePolicyPage from './pages/GeneratePolicyPage';

export default function App() {
  const hq = useQuery({ queryKey: ['health'], queryFn: health });
  const [topic, setTopic] = useState('');
  const mut = useMutation({ mutationFn: generatePolicy });

  return (
    <GeneratePolicyPage />
  );
}
