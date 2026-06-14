"use client";

import { useState, FormEvent } from "react";

export default function NotifyForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "" });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Waitlist signup:", form);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-3" style={{ color: "#C9A96E" }}>✦</div>
        <p className="text-lg font-medium" style={{ color: "#1C1C1C" }}>
          Terima kasih! Kami akan menghubungi Anda saat Videografi Fenoma resmi diluncurkan.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto">
      <input
        type="text"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Nama Anda"
        className="w-full px-4 py-3 border text-sm outline-none bg-white"
        style={{ borderColor: "#D4C9BC", color: "#1C1C1C" }}
        onFocus={(e) => (e.target.style.borderColor = "#C9A96E")}
        onBlur={(e) => (e.target.style.borderColor = "#D4C9BC")}
      />
      <input
        type="text"
        required
        value={form.contact}
        onChange={(e) => setForm({ ...form, contact: e.target.value })}
        placeholder="WhatsApp / Email"
        className="w-full px-4 py-3 border text-sm outline-none bg-white"
        style={{ borderColor: "#D4C9BC", color: "#1C1C1C" }}
        onFocus={(e) => (e.target.style.borderColor = "#C9A96E")}
        onBlur={(e) => (e.target.style.borderColor = "#D4C9BC")}
      />
      <button
        type="submit"
        className="w-full py-3 text-white text-sm font-medium tracking-wide hover:opacity-90 transition-opacity"
        style={{ background: "#C9A96E" }}
      >
        Beritahu Saya
      </button>
    </form>
  );
}
