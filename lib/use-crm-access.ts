"use client";

import { useEffect, useState } from "react";
import type { User, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";
import { checkCrmAccess } from "./crm-access";

type AccessState = {
  id: string | null;
  status: "checking" | "guest" | "allowed" | "denied";
};

export function useCrmAccess(
  db: SupabaseClient<Database> | null | undefined,
  user: Pick<User, "id" | "email"> | null | undefined,
): { loading: boolean; allowed: boolean } {
  const [state, setState] = useState<AccessState>({
    id: null,
    status: "checking",
  });

  useEffect(() => {
    if (!user?.id) {
      setState({ id: null, status: "guest" });
      return;
    }

    let alive = true;
    setState({ id: user.id, status: "checking" });

    checkCrmAccess(db, user)
      .then((allowed) => {
        if (alive) {
          setState({
            id: user.id,
            status: allowed ? "allowed" : "denied",
          });
        }
      })
      .catch(() => {
        if (alive) setState({ id: user.id, status: "denied" });
      });

    return () => {
      alive = false;
    };
  }, [db, user?.id, user?.email]);

  return {
    loading:
      Boolean(user?.id) &&
      (state.id !== user.id || state.status === "checking"),
    allowed:
      Boolean(user?.id) && state.id === user.id && state.status === "allowed",
  };
}
