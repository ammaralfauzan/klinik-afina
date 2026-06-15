"use client";
import { useEffect } from "react";
import { Bell, X } from "lucide-react";

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}

export default function Toast({ message, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => onClose(), 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(80px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .toast-container { animation: slideInRight 0.3s ease forwards; }
        .toast-close { background: none; border: none; cursor: pointer; color: #B0AECA; display: flex; align-items: center; transition: color 0.2s; padding: 2px; }
        .toast-close:hover { color: #1A1A2E; }
      `}</style>
      <div
        className="toast-container"
        style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: "#fff", borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          borderLeft: "4px solid #7B61FF",
          padding: "14px 18px", minWidth: "260px",
          display: "flex", alignItems: "center", gap: "12px",
        }}
      >
        <Bell size={18} color="#7B61FF" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A2E", flex: 1 }}>{message}</span>
        <button className="toast-close" onClick={onClose}>
          <X size={15} />
        </button>
      </div>
    </>
  );
}
