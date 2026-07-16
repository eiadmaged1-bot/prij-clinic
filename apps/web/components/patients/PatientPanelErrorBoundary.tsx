"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type PanelBoundaryProps = { panelKey: string; children: ReactNode; ownerDiagnostics?: boolean };
type PanelBoundaryState = { failed: boolean; failedAt: string | null; requestId: string | null };

export class PatientPanelErrorBoundary extends Component<PanelBoundaryProps, PanelBoundaryState> {
  state: PanelBoundaryState = { failed: false, failedAt: null, requestId: null };
  static getDerivedStateFromError() { return { failed: true, failedAt: new Date().toISOString(), requestId: createPanelRequestId() }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* PHI-safe: do not log component props or patient data. */ }
  componentDidUpdate(previous: PanelBoundaryProps) { if (previous.panelKey !== this.props.panelKey && this.state.failed) this.setState({ failed: false, failedAt: null, requestId: null }); }
  render() { return this.state.failed ? <section className="panel" role="alert"><p className="form-error">This panel could not be loaded. Other patient panels remain available.</p><p className="muted">Request {this.state.requestId} · {this.state.failedAt}</p>{this.props.ownerDiagnostics ? <details><summary>Owner diagnostics</summary><p className="muted">Panel key: {this.props.panelKey}. No patient data or stack trace is included.</p></details> : null}<button className="button secondary compact" type="button" onClick={() => this.setState({ failed: false, failedAt: null, requestId: null })}>Retry panel</button></section> : this.props.children; }
}

function createPanelRequestId() { return globalThis.crypto?.randomUUID?.() ?? `panel-${Date.now().toString(36)}`; }
