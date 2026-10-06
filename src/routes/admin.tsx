import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!profile?.is_super_admin) throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
