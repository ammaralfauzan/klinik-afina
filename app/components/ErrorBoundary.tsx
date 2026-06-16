"use client";
import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px", textAlign: "center",
      }}>
        <div style={{ maxWidth: "400px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
            Terjadi kesalahan
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 24px", lineHeight: 1.6 }}>
            Halaman ini mengalami error. Coba muat ulang halaman.
          </p>
          {this.state.message && (
            <pre style={{ fontSize: "11px", background: "var(--input-bg)", borderRadius: "8px", padding: "10px 14px", color: "var(--text-secondary)", textAlign: "left", whiteSpace: "pre-wrap", wordBreak: "break-word", marginBottom: "20px" }}>
              {this.state.message}
            </pre>
          )}
          <button
            onClick={() => { this.setState({ hasError: false, message: "" }); window.location.reload(); }}
            style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 24px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }
}
