"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button onClick={toggle} style={{
      display: "flex", alignItems: "center", gap: "8px",
      background: "var(--input-bg)",
      border: "1px solid var(--border-color)",
      borderRadius: "20px", padding: "6px 14px", cursor: "pointer",
      transition: "all 0.3s",
    }}>
      {dark ? <Sun size={14} color="var(--accent2)" /> : <Moon size={14} color="var(--accent)" />}
      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
        {dark ? "Light" : "Dark"}
      </span>
    </button>
  );
}
