import { Suspense } from "react";
import { GuidelineCenter } from "../GuidelineCenter";

export default function GuidelinesUpdatesPage() {
  return <Suspense fallback={<div className="panel empty-state">Loading library...</div>}><GuidelineCenter view="updates" /></Suspense>;
}
