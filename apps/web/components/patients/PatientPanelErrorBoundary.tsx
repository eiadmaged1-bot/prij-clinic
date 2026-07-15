"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

export class PatientPanelErrorBoundary extends Component<{ panelKey: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* PHI-safe: do not log component props or patient data. */ }
  componentDidUpdate(previous: { panelKey: string }) { if (previous.panelKey !== this.props.panelKey && this.state.failed) this.setState({ failed: false }); }
  render() { return this.state.failed ? <section className="panel"><p className="form-error">This panel could not be loaded. Other patient panels remain available.</p><button className="button secondary compact" type="button" onClick={() => this.setState({ failed: false })}>Retry panel</button></section> : this.props.children; }
}
