// src/hooks/useUserRole.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useUserRole() {
  const [role, setRole] = useState("viewer"); // default konservativ
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setRole("viewer"); setLoading(false); return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (active) {
        if (error) {
          console.error(error);
          setRole("viewer");
        } else {
          setRole(data?.role ?? "viewer");
        }
        setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, []);

  return { role, isAdmin: role === "admin", loading };
}
