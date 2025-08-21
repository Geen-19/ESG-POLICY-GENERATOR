// web/src/components/PolicyActions.jsx
import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { copyPolicyToClipboard } from '../lib/policyClipboard';

export default function PolicyActions({ policy }) {
  const [isCopying, setIsCopying] = useState(false);
  const [downloading, setDownloading] = useState(null); 

  const sortedBlocks = [...(policy?.blocks || [])].sort((a,b) => (a.order ?? 0) - (b.order ?? 0));

  const onCopy = async () => {
    try {
      setIsCopying(true);
      await copyPolicyToClipboard(sortedBlocks, policy.topic);
      toast.success('Policy copied to clipboard');
    } catch (e) {
      console.error(e);
      toast.error('Copy failed');
    } finally {
      setIsCopying(false);
    }
  };

  const download = async (format) => {
    try {
      setDownloading(format);
      // prefer GET with query for ease
      const url = `http://localhost:4000/api/policies/${policy._id}/export?format=${format}`;
      const resp = await fetch(url, { method: 'GET' });
      if (!resp.ok) {
            console.log(resp);
            throw new Error('Export failed');
      } 

      const blob = await resp.blob();
      const a = document.createElement('a');
      const f = `${sanitize(policy.topic)}.${format}`;
      a.href = URL.createObjectURL(blob);
      a.download = f;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast.success(`Downloaded ${format.toUpperCase()}`);
    } catch (e) {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Toaster position="top-right" />

      <button
        className="px-3 py-2 rounded bg-neutral-900 text-white disabled:opacity-60"
        onClick={onCopy}
        disabled={isCopying}
      >
        {isCopying ? 'Copying…' : 'Copy policy text'}
      </button>

      <button
        className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
        onClick={() => download('pdf')}
        disabled={!!downloading}
        title="Export PDF"
      >
        {downloading === 'pdf' ? 'Exporting PDF…' : 'Export PDF'}
      </button>

      <button
        className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-60"
        onClick={() => download('docx')}
        disabled={!!downloading}
        title="Export Word (.docx)"
      >
        {downloading === 'docx' ? 'Exporting DOCX…' : 'Export DOCX'}
      </button>
    </div>
  );
}

function sanitize(s='file') {
  return s.replace(/[\\/:*?"<>|]+/g, '_');
}
