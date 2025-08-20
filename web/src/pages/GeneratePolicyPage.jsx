import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { generatePolicy, fetchPolicy } from "../api/policies";
import PolicyEditor from "../ui/PolicyEditor";
import { getCounts } from "../lib/blocks";

export default function GeneratePolicyPage() {
  const qc = useQueryClient();
  const [topic, setTopic] = useState("");
  const [policyId, setPolicyId] = useState(null);

  const genMut = useMutation({
    mutationFn: () => {
      if (!topic.trim()) {
        const err = new Error("Please enter a topic.");
        err.code = "EMPTY_TOPIC";
        throw err;
      }
      return generatePolicy(topic.trim());
    },
    onMutate: () => {
      // UI lock handled by isPending
    },
    onSuccess: (policy) => {
      // (Optional) purge any previous policy cache to avoid accidental reads elsewhere
      const oldIds = qc.getQueryCache().findAll({ queryKey: ["policy"] }).map(q => q.queryKey[1]).filter(Boolean);
      oldIds.forEach(id => { if (id !== policy._id) qc.removeQueries({ queryKey: ["policy", id] }); });

      qc.setQueryData(["policy", policy._id], policy);
      setPolicyId(policy._id);
      toast.success("Policy generated!");
    },

    onError: (err) => {
      if (err.code === "EMPTY_TOPIC") {
        toast.error("Topic can't be empty.");
        return;
      }
      toast.error(err?.response?.data?.message || "Network error while generating.");
    },
  });

  const { data: policy } = useQuery({
    enabled: !!policyId,
    queryKey: ["policy", policyId],
    queryFn: () => fetchPolicy(policyId),
    staleTime: Infinity,
  });

  const counts = useMemo(() => (policy ? getCounts(policy.blocks || []) : { words: 0, chars: 0 }), [policy]);

  return (
    // inside return()
    <>
      <header className="px-6 py-4 sticky top-0 z-10 bg-gradient-to-b from-white/90 to-white/60 dark:from-zinc-900/90 dark:to-zinc-900/60 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-semibold">ESG Policy Generator</h1>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <form
            className="card p-3 md:p-4 flex flex-col md:flex-row gap-3 md:items-center"
            onSubmit={(e) => { e.preventDefault(); genMut.mutate(); }}
          >
            <input
              className="input flex-1"
              placeholder="Enter ESG topic, e.g., “Water Conservation Policy for Plants”"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button type="submit" disabled={genMut.isPending} className="btn-primary">
              {genMut.isPending ? "Generating…" : "Generate Policy"}
            </button>
          </form>

          {policy && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Editor */}
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-900/70 flex items-center justify-between">
                  <div className="font-medium truncate">{policy.topic}</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {counts.words} words · {counts.chars} chars
                  </div>
                </div>
                <PolicyEditor policyId={policy._id} />
              </div>

              {/* Preview */}
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-900/70 font-medium">
                  Preview
                </div>
                <PreviewPane policyId={policy._id} />
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}


/* Inline preview pulling from cache for "live" feel */
function PreviewPane({ policyId }) {
  const qc = useQueryClient();
  // Read directly from cache so edits show instantly
  const policy = qc.getQueryData(["policy", policyId]);
  if (!policy) return null;

  const blocks = [...(policy.blocks || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="p-4 prose max-w-none">
      {blocks.map((b) => {
        if (b.type === "heading") {
          const text = b.title || b.content || "";
          return <h2 key={b.id} className="text-lg font-semibold mt-4">{text}</h2>;
        }
        if (b.type === "list") {
          const items = Array.isArray(b.content) ? b.content : String(b.content || "").split("\n");
          return (
            <ul key={b.id} className="list-disc ml-6 mt-2">
              {items.filter(Boolean).map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          );
        }
        return <p key={b.id} className="mt-3 whitespace-pre-wrap">{String(b.content || "")}</p>;
      })}
    </div>
  );
}
