"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Pasien = {
  nama: string;
  keluhan: string;
  status: string;
  nomor_antrian: number;
};

export default function Home() {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-sm text-gray-500">Pasien Hari Ini</p>
        <h2 className="text-3xl font-bold text-blue-600 mt-1">{pasienList.length}</h2>
      </div>
      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-sm text-gray-500">Antrian Aktif</p>
        <h2 className="text-3xl font-bold text-green-500 mt-1">
          {pasienList.filter(p => p.status === "Menunggu").length}
        </h2>
      </div>
      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-sm text-gray-500">Sedang Diperiksa</p>
        <h2 className="text-3xl font-bold text-purple-500 mt-1">
          {pasienList.filter(p => p.status === "Sedang Diperiksa").length}
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow p-5 md:col-span-3">
        <h3 className="font-semibold text-gray-700 mb-3">Antrian Pasien</h3>
        {pasienList.length === 0 ? (
          <p className="text-gray-400 text-sm">Belum ada pasien hari ini.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b">
                <th className="pb-2">No</th>
                <th className="pb-2">Nama Pasien</th>
                <th className="pb-2">Keluhan</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {pasienList.map((p) => (
                <tr key={p.nomor_antrian} className="border-b last:border-0">
                  <td className="py-3">{p.nomor_antrian}</td>
                  <td className="py-3">{p.nama}</td>
                  <td className="py-3">{p.keluhan}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === "Sedang Diperiksa"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}