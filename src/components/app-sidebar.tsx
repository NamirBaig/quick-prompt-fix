import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Stethoscope, LayoutDashboard, History, LibraryBig, Activity, LogOut } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Dict } from "@/lib/i18n";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { key: "navAnalyzer", url: "/", icon: Activity },
  { key: "navDashboard", url: "/dashboard", icon: LayoutDashboard },
  { key: "navHistory", url: "/history", icon: History },
  { key: "navTemplates", url: "/templates", icon: LibraryBig },
] as const satisfies readonly { key: keyof Dict; url: string; icon: typeof Activity }[];

function useAccount() {
  const [account, setAccount] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!active) return;
      if (!user) {
        setAccount(null);
        return;
      }
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const name =
        (typeof meta["display_name"] === "string" && meta["display_name"]) ||
        (typeof meta["full_name"] === "string" && meta["full_name"]) ||
        (user.email ?? "").split("@")[0] ||
        "Account";
      setAccount({ name: String(name), email: user.email ?? "" });
    };
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return account;
}

export function AppSidebar() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const account = useAccount();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-1 py-2">
          <span className="gradient-hero flex size-9 shrink-0 items-center justify-center rounded-xl text-brand-foreground shadow-soft">
            <Stethoscope className="size-5" />
          </span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate font-display text-sm font-semibold">{t("appName")}</p>
            <p className="truncate text-xs text-muted-foreground">{t("subtitleSidebar")}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("workspace")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={t(item.key)}>
                    <Link to={item.url}>
                      <item.icon className="size-4" />
                      <span>{t(item.key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {account && (
        <SidebarFooter className="border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-1 py-1.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold uppercase text-primary">
              {account.name.slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium">{account.name}</p>
              <p className="truncate text-xs text-muted-foreground">{account.email}</p>
            </div>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={signOut} tooltip="Sign out">
                <LogOut className="size-4" />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
