import { useQuery, useQueryClient } from "@tanstack/react-query";
import BlockEditor from "./blocks/BlockEditor";

export default function PolicyEditor({ policyId }) {
  const { data: policy } = useQuery({ queryKey: ["policy", policyId], staleTime: Infinity, enabled: !!policyId });
  const qc = useQueryClient();

  if (!policy) return null;
  const blocks = [...(policy.blocks || [])].sort((a, b) => {
    const ao = Number.isFinite(a.order) ? a.order : 1e9; // push undefined to bottom but stable
    const bo = Number.isFinite(b.order) ? b.order : 1e9;
    if (ao !== bo) return ao - bo;
    // secondary stable sort by id to avoid jitter
    return String(a.id ?? "").localeCompare(String(b.id ?? ""));
  });


  const updateBlock = (id, updater) => {
  const prev = qc.getQueryData(["policy", policyId]);
  if (!prev) return;

  let changed = false;
  const nextBlocks = prev.blocks.map(b => {
    if (b.id !== id) return b;
    const proposed = updater(b);
    // shallow compare to skip no-op writes
    const newContent = proposed.content ?? b.content;
    const newTitle = proposed.title ?? b.title;
    if (newContent !== b.content || newTitle !== b.title) {
      changed = true;
      return { ...b, content: newContent, title: newTitle };
    }
    return b;
  });

  if (changed) {
    qc.setQueryData(["policy", policyId], {
      ...prev,
      blocks: nextBlocks,
      meta: { ...prev.meta, modifiedAt: new Date().toISOString() },
    });
  }
};


  // ...
  return (
    <div className="divide-y" key={policyId /* force remount of the whole editor when policy changes */}>
      {blocks.map((b, i) => {
        const clientKey = `${policyId}:${b.id ?? i}:${b.type ?? "t"}:${b.order ?? i}`;
        return (
          <BlockEditor
            key={clientKey}
            block={b}
            onChange={(content, title) => {
              updateBlock(b.id, () => ({
                content,
                ...(title !== undefined ? { title } : {}),
              }));
            }}
          />
        );
      })}
    </div>
  );
  // ...

}
