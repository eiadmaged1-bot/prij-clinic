import { redirect } from "next/navigation";

export default function MedicationSearchPage() {
  redirect("/medications?tab=search");
}
