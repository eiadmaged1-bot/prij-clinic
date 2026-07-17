import { Suspense } from "react";
import { GuidelineCenter } from "../GuidelineCenter";

export default function GuidelinesSearchPage() {
  return <Suspense fallback={<div className="panel empty-state">Loading library...</div>}><GuidelineCenter view="search" /></Suspense>;
}
