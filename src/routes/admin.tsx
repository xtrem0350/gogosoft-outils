import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    if (location.pathname.startsWith("/admin/boutique")) return;
    const [{ data: profile, error: profileError }, { data: adminRole, error: roleError }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("is_super_admin")
          .eq("id", data.user.id)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle(),
      ]);
    if (profileError) throw profileError;
    if (roleError) throw roleError;
    if (!profile?.is_super_admin && !adminRole) throw redirect({ to: "/dashboard" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
