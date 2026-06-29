import { ProtocolAtlasBrowser } from "../../components/protocol-atlas/ProtocolAtlasBrowser";
import { AppShell, SafetyAlert } from "../mvp-page";

export default function ProtocolAtlasPage() {
  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Women&apos;s Health Protocol Atlas</p>
            <h1>Protocol Atlas</h1>
          </div>
          <span className="badge warning">Doctor review required</span>
        </div>
        <p className="muted">Search local deterministic protocols. Only verified protocols can generate short management snapshots for doctor review.</p>
      </section>
      <SafetyAlert />
      <ProtocolAtlasBrowser />
    </AppShell>
  );
}
