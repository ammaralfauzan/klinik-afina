"use client";

import { useState, FormEvent } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    eventDate: "",
    location: "",
    message: "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Inquiry submitted:", form);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-16 px-8" style={{ background: "#F5F0E8" }}>
        <div className="text-4xl mb-4">✦</div>
        <h3
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#1C1C1C" }}
        >
          Terima kasih!
        </h3>
        <p className="text-base" style={{ color: "#8A8A8A" }}>
          Pesan Anda telah kami terima. Tim Fenoma akan segera menghubungi Anda dalam 1×24 jam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#1C1C1C" }}>
            Nama Lengkap *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nama Anda"
            className="w-full px-4 py-3 border text-sm outline-none transition-colors duration-200 bg-white"
            style={{ borderColor: "#D4C9BC", color: "#1C1C1C" }}
            onFocus={(e) => (e.target.style.borderColor = "#C9A96E")}
            onBlur={(e) => (e.target.style.borderColor = "#D4C9BC")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#1C1C1C" }}>
            WhatsApp / Email *
          </label>
          <input
            type="text"
            required
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            placeholder="+62 8xx / email@anda.com"
            className="w-full px-4 py-3 border text-sm outline-none transition-colors duration-200 bg-white"
            style={{ borderColor: "#D4C9BC", color: "#1C1C1C" }}
            onFocus={(e) => (e.target.style.borderColor = "#C9A96E")}
            onBlur={(e) => (e.target.style.borderColor = "#D4C9BC")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#1C1C1C" }}>
            Tanggal Acara
          </label>
          <input
            type="date"
            value={form.eventDate}
            onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
            className="w-full px-4 py-3 border text-sm outline-none transition-colors duration-200 bg-white"
            style={{ borderColor: "#D4C9BC", color: "#1C1C1C" }}
            onFocus={(e) => (e.target.style.borderColor = "#C9A96E")}
            onBlur={(e) => (e.target.style.borderColor = "#D4C9BC")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#1C1C1C" }}>
            Lokasi Acara
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Kota / Venue"
            className="w-full px-4 py-3 border text-sm outline-none transition-colors duration-200 bg-white"
            style={{ borderColor: "#D4C9BC", color: "#1C1C1C" }}
            onFocus={(e) => (e.target.style.borderColor = "#C9A96E")}
            onBlur={(e) => (e.target.style.borderColor = "#D4C9BC")}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "#1C1C1C" }}>
          Pesan *
        </label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Ceritakan tentang acara Anda, paket yang diminati, atau pertanyaan lainnya..."
          className="w-full px-4 py-3 border text-sm outline-none transition-colors duration-200 bg-white resize-none"
          style={{ borderColor: "#D4C9BC", color: "#1C1C1C" }}
          onFocus={(e) => (e.target.style.borderColor = "#C9A96E")}
          onBlur={(e) => (e.target.style.borderColor = "#D4C9BC")}
        />
      </div>
      <button
        type="submit"
        className="self-start px-8 py-3 text-white text-sm font-medium tracking-wide hover:opacity-90 transition-opacity duration-200"
        style={{ background: "#C9A96E" }}
      >
        Kirim Pesan
      </button>
    </form>
  );
}
