"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccessGate } from "@/lib/access/useAccessGate";
import { Card, CardContent } from "@/app/_components/ui/card";
import PageShell from "@/app/_components/ui/page-shell";

export default function RequireAccess({
  children,
  requiresSubscription = false,
  loginRedirectTo,
  subscriptionRedirectTo = "/explore-subscriptions",
}: {
  children: React.ReactNode;
  requiresSubscription?: boolean;
  loginRedirectTo?: string;
  subscriptionRedirectTo?: string;
}) {
  const router = useRouter();
  const access = useAccessGate();

  useEffect(() => {
    if (access.loading) return;

    if (!access.isLoggedIn) {
      const next = loginRedirectTo ? `?next=${encodeURIComponent(loginRedirectTo)}` : "";
      router.replace(`/login${next}`);
      return;
    }

    if (requiresSubscription && !access.isSubscribed) {
      router.replace(subscriptionRedirectTo);
    }
  }, [
    access.loading,
    access.isLoggedIn,
    access.isSubscribed,
    requiresSubscription,
    loginRedirectTo,
    subscriptionRedirectTo,
    router,
  ]);

  if (access.loading) {
    return (
      <PageShell>
        <Card muted>
          <CardContent className="py-10">
            <p className="text-sm text-slate-600">Checking access...</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (access.error) {
    return (
      <PageShell>
        <Card muted>
          <CardContent className="py-10">
            <p className="text-sm text-red-600">{access.error}</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!access.isLoggedIn) {
    return null;
  }

  if (requiresSubscription && !access.isSubscribed) {
    return null;
  }

  return <>{children}</>;
}
