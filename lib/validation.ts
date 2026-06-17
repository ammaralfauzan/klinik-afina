// NIK cross-check: digit 7–8 = hari lahir (perempuan +40), 9–10 = bulan, 11–12 = 2 digit tahun
export function validateNIK(nik: string, tanggalLahir?: string): string | null {
  const d = nik.replace(/\D/g, "");
  if (!d) return "NIK wajib diisi";
  if (d.length !== 16) return "NIK harus tepat 16 digit";

  const nikDay   = parseInt(d.substring(6, 8));
  const nikMonth = parseInt(d.substring(8, 10));
  const nikYear2 = parseInt(d.substring(10, 12));
  const realDay  = nikDay > 40 ? nikDay - 40 : nikDay;

  if (realDay < 1 || realDay > 31) return "NIK tidak valid (tanggal di NIK tidak masuk akal)";
  if (nikMonth < 1 || nikMonth > 12) return "NIK tidak valid (bulan di NIK tidak masuk akal)";

  if (tanggalLahir) {
    const parts = tanggalLahir.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const [yr, mo, dy] = parts;
      if (realDay !== dy || nikMonth !== mo || nikYear2 !== yr % 100) {
        return "NIK tidak cocok dengan tanggal lahir yang diisi";
      }
    }
  }
  return null;
}

export function validateNoHp(no: string): string | null {
  const digits = no.replace(/\D/g, "");
  if (!digits) return "Nomor HP wajib diisi";
  if (!/^(08|628)\d+$/.test(digits)) return "Awalan HP harus 08 atau +62";
  if (digits.length < 10 || digits.length > 13) return "Nomor HP harus 10–13 digit";
  return null;
}

export function normalizeName(nama: string): string {
  return nama.trim().replace(/\s+/g, " ");
}

export function validateNama(nama: string): string | null {
  const clean = normalizeName(nama);
  if (!clean) return "Nama wajib diisi";
  if (clean.length < 3) return "Nama minimal 3 karakter";
  if (/\d/.test(clean)) return "Nama tidak boleh mengandung angka";
  if (!/^[a-zA-Z\s'.,\-]+$/.test(clean)) return "Karakter nama tidak valid";
  return null;
}

export function validateNomorBPJS(nomor: string): string | null {
  const d = nomor.replace(/\D/g, "");
  if (!d) return "Nomor BPJS wajib diisi";
  if (d.length !== 13) return "Nomor BPJS harus tepat 13 digit";
  return null;
}
