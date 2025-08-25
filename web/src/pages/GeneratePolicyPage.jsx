import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { generatePolicy, fetchPolicy, saveBlocks } from "../api/policies";
import PolicyEditor from "../ui/PolicyEditor";
import { getCounts } from "../lib/blocks";
import PolicyActions from "./PolicyActions";
import canonPolicy from "../lib/canonPolicy";
export default function GeneratePolicyPage() {
  const qc = useQueryClient();
  const [topic, setTopic] = useState("");
  const [policyId, setPolicyId] = useState(null);

  // pick up ?id=... on reload
  useEffect(() => {
    const url = new URL(window.location.href);
    const id = url.searchParams.get("id");
    if (id) setPolicyId(id);
  }, []);

  const genMut = useMutation({
    mutationFn: () => {
      const t = topic.trim();
      if (!t) {
        const e = new Error("EMPTY_TOPIC");
        throw e;
      }
      return generatePolicy({ topic: t });
    },
    onSuccess: (policy) => {
      // clear other cache entries to avoid stale reads
      qc.removeQueries({ queryKey: ["policy"], exact: false });
      qc.setQueryData(["policy", policy._id], canonPolicy(policy));
      setPolicyId(policy._id);

      // push id to URL so reload works
      const url = new URL(window.location.href);
      url.searchParams.set("id", policy._id);
      window.history.replaceState({}, "", url.toString());

      toast.success("Policy generated!");
    },
    onError: (err) => {
      console.log(err);

      if (err?.message === "EMPTY_TOPIC") toast.error("Topic can't be empty.");

      else toast.error(err?.response?.data?.message || "Network error while generating.");
    },
  });

  const { data: policy } = useQuery({
    enabled: !!policyId,
    queryKey: ["policy", policyId],
    queryFn: () => fetchPolicy(policyId),
    staleTime: 0,
    select: canonPolicy,
  });

  const counts = useMemo(() => (policy ? getCounts(policy.blocks || []) : { words: 0, chars: 0 }), [policy]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const p = qc.getQueryData(["policy", policyId]);
      if (!p) return;
      const res = await saveBlocks(policyId, p.blocks || []);
      toast.success("Saved");
      // refetch to confirm persisted order/content
      await qc.invalidateQueries({ queryKey: ["policy", policyId] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "Save failed"),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 sticky top-0 z-10 bg-gradient-to-b from-white/90 to-white/60 dark:from-zinc-900/90 dark:to-zinc-900/60 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <h1 className="text-lg md:text-xl font-semibold">ESG Policy Generator</h1>
          {policy && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {counts.words} words · {counts.chars} chars
              </span>
              <button
                className="btn-primary"
                onClick={() => saveMut.mutate()}
                disabled={saveMut.isPending}
              >
                {saveMut.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          )}
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
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-900/70 flex items-center justify-between">
                  <div className="font-medium truncate">{policy.topic}</div>
                </div>
                <PolicyEditor policyId={policy._id} />
                <PolicyActions policy={policy} />

              </div>

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
    </div>
  );
}

import { useQueryClient as useQC } from "@tanstack/react-query";
function PreviewPane({ policyId }) {
  const qc = useQC();
  const { data: policy } = useQuery({
    queryKey: ["policy", policyId],
    queryFn: () => fetchPolicy(policyId),
    enabled: !!policyId,
    staleTime: 0,
    initialData: () => {
      qc.getQueryData(["policy", policyId]);
      return cached ? canonPolicy(cached) : undefined;
    },
    select: canonPolicy,
  });
  if (!policy) return null;

  const blocks = useMemo(
    () => [...(policy.blocks || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [policy?.blocks]
  );

  const bodyHtml = useMemo(() => renderBlocksToHtml(blocks), [blocks]);

  return (
    <div
      className="p-5 prose prose-zinc dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: bodyHtml }}
    />
  );
}
function allowInlineMarks(html = "") {
  let s = String(html);
  s = s.replace(/<\s*b(\s|>)/gi, "<strong$1").replace(/<\/\s*b\s*>/gi, "</strong>");
  s = s.replace(/<\s*i(\s|>)/gi, "<em$1").replace(/<\/\s*i\s*>/gi, "</em>");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/\son\w+="[^"]*"/gi, "");
  s = s.replace(/<(?!\/?(p|br|strong|em|ul|ol|li)\b)[^>]*>/gi, "");
  return s;
}

function ensureBlockTag(html, tag) {
  const t = tag.toLowerCase(), h = String(html).trim();
  return new RegExp(`^<${t}\\b[\\s\\S]*</${t}>$`, "i").test(h) ? h : `<${t}>${h}</${t}>`;
}
function extractInlineOnly(html = "") {
  let s = allowInlineMarks(html);
  // drop any stray block tags inside headings
  s = s.replace(/<\/?(p|h[1-6]|ul|ol|li)[^>]*>/gi, "");
  return s.trim();
}
function renderBlocksToHtml(blocks = []) {
  const parts = blocks.map((b) => {
    if (b.type === "heading" || /<\s*h[1-6]\b/i.test(String(b.content))) {
     // prefer non-empty title; else content
     const source = (typeof b.title === "string" && b.title.trim().length)
       ? b.title
       : String(b.content ?? "");
     const inline = extractInlineOnly(source);
     return `<h2 class="mt-4">${inline || ""}</h2>`;
   }
    if (b.type === "list") {
      const items = Array.isArray(b.content)
        ? b.content
        : String(b.content || "").split("\n").map((s) => s.trim()).filter(Boolean);
      return `<ul class="mt-2">${items.map((li) => `<li>${allowInlineMarks(li)}</li>`).join("")}</ul>`;
    }
    const html = allowInlineMarks(String(b.content ?? ""));
    return ensureBlockTag(`<span class="not-prose"></span>${html}`, "p") // preserve prose spacing
      .replace("<p>", `<p class="mt-3">`);
  });
  return parts.join("\n");
}