"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function PasienPage() {
  const [form, setForm] = useState({
    nama: "",
    keluhan: "",
    status: "Menunggu",
    nomor_antrian: 1,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setSuccess(false);

    // Ambil nomor antrian terakhir
    const { data: lastData } = await supabase
      .from("pasien")
      .select("nomor_antrian")
      .order("nomor_antrian", { ascending: false })
      .limit(1);

    const nomorBaru = lastData && lastData.length > 0 
      ? lastData[0].nomor_antrian + 1 
      : 1;

    const { error } = await supabase.from("pasien").insert([
      {
        nama: form.nama,
        keluhan: form.keluhan,
        status: "Menunggu",
        nomor_antrian: nomorBaru,
        created_at: new Date().toISOString(),
      },
    ]);

    setLoading(false);
    if (!error) {
      setSuccess(true);
      setForm({ nama: "", keluhan: "", status: "Menunggu", nomor_antrian: 1 });
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-bold text-gray-700 mb-6">Registrasi Pasien Baru</h2>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          ✅ Pasien berhasil didaftarkan!
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Nama Pasien</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Masukkan nama pasien"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Keluhan</label>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Masukkan keluhan pasien"
            rows={3}
            value={form.keluhan}
            onChange={(e) => setForm({ ...form, keluhan: e.target.value })}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || !form.nama || !form.keluhan}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Mendaftarkan..." : "Daftarkan Pasien"}
        </button>
      </div>
    </div>
  );
}