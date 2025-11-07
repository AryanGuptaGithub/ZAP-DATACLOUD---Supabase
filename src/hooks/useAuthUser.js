// useAuthUser.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function useAuthUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data: { session } = {} } = await supabase.auth.getSession();
      if (!cancelled) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    }
    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_evt, session) => setUser(session?.user ?? null)
    );

    return () => {
      cancelled = true;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  return { user, loading };
}
