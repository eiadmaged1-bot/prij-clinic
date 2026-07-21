import { Suspense } from "react";
import { UnifiedKnowledgeSearchWorkspace } from "./UnifiedKnowledgeSearchWorkspace";

export default function GuidelinesSearchPage() {
  return (
    <Suspense fallback={<div className="panel empty-state">Loading clinical knowledge search…</div>}>
      <UnifiedKnowledgeSearchWorkspace />
    </Suspense>
  );
}
