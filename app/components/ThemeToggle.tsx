"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button onClick={toggle} style={{
      display: "flex", alignItems: "center", gap: "8px",
      background: dark ? "rgba(168,85,247,0.1)" : "rgba(99,102,241,0.1)",
      border: dark ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(99,102,241,0.3)",
      borderRadius: "20px", padding: "6px 14px", cursor: "pointer",
      transition: "all 0.3s",
    }}>
      {dark ? <Sun size={14} color="#fbbf24" /> : <Moon size={14} color="#6366f1" />}
      <span style={{ fontSize: "12px", fontWeight: 600, color: dark ? "#fbbf24" : "#6366f1" }}>
        {dark ? "Light" : "Dark"}
      </span>
    </button>
  );
}
