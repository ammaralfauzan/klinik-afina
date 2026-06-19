"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { normRole, type Role } from "../../lib/roles";

type RoleCtx = { role: Role; ready: boolean };
const Ctx = createContext<RoleCtx>({ role: "admin", ready: false });

export function useRole() { return useContext(Ctx); }

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("admin");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (alive) setReady(true); return; }
      const { data, error } = await supabase.rpc("staff_role");
      if (!alive) return;
      // Bila RPC belum ada (Langkah 19 belum dijalankan) -> tetap 'admin'.
      if (error) { setRole("admin"); setReady(true); return; }
      setRole(normRole(data as string | null));
      setReady(true);
    }
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  return <Ctx.Provider value={{ role, ready }}>{children}</Ctx.Provider>;
}
