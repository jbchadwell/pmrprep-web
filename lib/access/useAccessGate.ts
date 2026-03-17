"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export type TrialStatus = {
  mode: "preview" | "preview_locked" | "trial" | "trial_locked" | "subscriber";
  plan: string;
  subscribed: boolean;
  needsEmail: boolean;
  answered: number;
  limit: number | null;
  remaining: number | null;
  locked: boolean;
  message: string | null;
};

export type AccessGateState = {
  loading: boolean;
  isLoggedIn: boolean;
  isSubscribed: boolean;
  userEmail: string;
  trialStatus: TrialStatus | null;
  error: string;
};

export function useAccessGate() {
  const [state, setState] = useState<AccessGateState>({
    loading: true,
    isLoggedIn: false,
    isSubscribed: false,
    userEmail: "",
    trialStatus: null,
    error: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const {
          data: { session },
        } = await supabaseBrowser.auth.getSession();

        if (!session?.access_token) {
          if (!cancelled) {
            setState({
              loading: false,
              isLoggedIn: false,
              isSubscribed: false,
              userEmail: "",
              trialStatus: null,
              error: "",
            });
          }
          return;
        }

        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();

        const res = await fetch("/api/trial-status", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load access status");
        }

        if (!cancelled) {
          setState({
            loading: false,
            isLoggedIn: true,
            isSubscribed: Boolean(json?.subscribed),
            userEmail: user?.email ?? "",
            trialStatus: json,
            error: "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            loading: false,
            isLoggedIn: false,
            isSubscribed: false,
            userEmail: "",
            trialStatus: null,
            error: err instanceof Error ? err.message : "Unknown access error",
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
