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
  const userId = user?.id;
  const userEmail = user?.email;

  useEffect(() => {
    if (!userId || !userEmail) {
      setState({ id: null, status: "guest" });
      return;
    }

    let alive = true;
    setState({ id: userId, status: "checking" });

    checkCrmAccess(db, { id: userId, email: userEmail })
      .then((allowed) => {
        if (alive) {
          setState({
            id: userId,
            status: allowed ? "allowed" : "denied",
          });
        }
      })
      .catch(() => {
        if (alive) setState({ id: userId, status: "denied" });
      });

    return () => {
      alive = false;
    };
  }, [db, userId, userEmail]);

  return {
    loading:
      Boolean(userId) &&
      (state.id !== userId || state.status === "checking"),
    allowed:
      Boolean(userId) && state.id === userId && state.status === "allowed",
  };
}
