import Link from "next/link";
import { ProtocolAtlasBrowser } from "../../components/protocol-atlas/ProtocolAtlasBrowser";
import { AppShell, SafetyAlert } from "../mvp-page";

export default function ProtocolAtlasPage() {
  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Guidelines &amp; Protocols</p>
            <h1>Protocol Atlas</h1>
            <p className="muted">Reviewed, source-linked clinical pathways for Doctor review.</p>
          </div>
          <span className="badge warning">Doctor review required</span>
        </div>
      </section>

      <nav className="tab-row" aria-label="Clinical knowledge navigation">
        <Link className="button secondary" href="/guidelines">📚 Guidelines</Link>
        <Link className="button" href="/protocol-atlas">🧭 Protocols</Link>
        <Link className="button secondary" href="/guidelines/search">⌕ Unified Search</Link>
        <Link className="button secondary" href="/guidelines/ask">✦ Ask Approved Library</Link>
      </nav>

      <SafetyAlert />
      <ProtocolAtlasBrowser />
    </AppShell>
  );
}
