import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Antrian — Klinik & RB Afina",
  description: "Display antrian digital Klinik & RB Afina",
};

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
