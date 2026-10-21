import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (data.user) return;
    // On a flaky connection, keep a still-valid local session instead of bouncing to sign-in.
    if (error?.name === "AuthRetryableFetchError") {
      const { data: s } = await supabase.auth.getSession();
      if (s.session) return;
    }
    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
