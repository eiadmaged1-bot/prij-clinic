import { CalculatorHub } from "../../components/calculators/CalculatorHub";
import { AppShell, SafetyAlert } from "../mvp-page";

export default function CalculatorsPage() {
  return (
    <AppShell>
      <CalculatorHub />
      <SafetyAlert />
    </AppShell>
  );
}
