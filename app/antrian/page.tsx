"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Pasien = {
  nama: string;
  keluhan: string;
  status: string;
  nomor_antrian: number;
};

export default function AntrianPage() {
  const [pasienList, setPasienList] = useState<Pasien[]>([]);

  useEffect(() => {
    fetchPasien();
  }, []);

  async function fetchPasien() {
    const { data } = await supabase
      .from("pasien")
      .select("*")
      .order("nomor_antrian", { ascending: true });
    if (data) setPasienList(data);
  }

  async function updateStatus(nomor: number, status: string) {
    await supabase
      .from("pasien")
      .update({ status })
      .eq("nomor_antrian", nomor);
    fetchPasien();
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-700 mb-6">Manajemen Antrian</h2>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-400 border-b">
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Nama Pasien</th>
              <th className="px-4 py-3">Keluhan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pasienList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Belum ada antrian hari ini
                </td>
              </tr>
            ) : (
              pasienList.map((p) => (
                <tr key={p.nomor_antrian} className="border-b last:border-0">
                  <td className="px-4 py-3">{p.nomor_antrian}</td>
                  <td className="px-4 py-3 font-medium">{p.nama}</td>
                  <td className="px-4 py-3">{p.keluhan}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === "Sedang Diperiksa"
                        ? "bg-blue-100 text-blue-600"
                        : p.status === "Selesai"
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    {p.status === "Menunggu" && (
                      <button
                        onClick={() => updateStatus(p.nomor_antrian, "Sedang Diperiksa")}
                        className="bg-blue-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Panggil
                      </button>
                    )}
                    {p.status === "Sedang Diperiksa" && (
                      <button
                        onClick={() => updateStatus(p.nomor_antrian, "Selesai")}
                        className="bg-green-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Selesai
                      </button>
                    )}
                    {p.status === "Selesai" && (
                      <span className="text-gray-400 text-xs">✓ Done</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}