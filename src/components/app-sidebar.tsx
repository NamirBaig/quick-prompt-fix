import { Link, useRouterState } from "@tanstack/react-router";
import { Stethoscope, LayoutDashboard, History, LibraryBig, Activity } from "lucide-react";

import { useI18n, type Dict } from "@/lib/i18n";
import {
  Sidebar,
  SidebarContent,
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

export function AppSidebar() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

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
    </Sidebar>
  );
}
