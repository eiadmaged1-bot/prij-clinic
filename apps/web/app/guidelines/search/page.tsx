import { Suspense } from "react";
import { UnifiedKnowledgeSearchWorkspace } from "./UnifiedKnowledgeSearchWorkspace";
import styles from "./UnifiedKnowledgeSearchWorkspace.module.css";

export default function GuidelinesSearchPage() {
  return (
    <div className={styles.workspace}>
      <Suspense fallback={<div className="panel empty-state">Loading clinical knowledge search…</div>}>
        <UnifiedKnowledgeSearchWorkspace />
      </Suspense>
    </div>
  );
}
