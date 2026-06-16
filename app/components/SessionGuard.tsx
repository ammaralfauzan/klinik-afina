"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";

const PUBLIC = ["/login", "/display", "/daftar-online"];

export default function SessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (PUBLIC.some(r => pathname === r || pathname.startsWith(r + "/"))) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        if (event === "SIGNED_OUT") {
          document.cookie = "isLoggedIn=; path=/; max-age=0";
          localStorage.removeItem("isLoggedIn");
          router.push("/login");
        }
      }
    });

    // Also check on mount: if no active session, redirect
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        document.cookie = "isLoggedIn=; path=/; max-age=0";
        localStorage.removeItem("isLoggedIn");
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  return null;
}
