import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  PawPrint,
  Syringe,
  Stethoscope,
  Briefcase,
  Package,
  ReceiptText,
  BarChart3,
  UserCog,
  ShieldCheck,
  Globe,
  Building2,
  CreditCard,
  Heart,
  Sparkles,
} from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { useClinic } from "@/lib/clinic-context";

const clinicNav = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Appointments", url: "/app/appointments", icon: CalendarDays },
  { title: "Customers", url: "/app/customers", icon: Users },
  { title: "Pets", url: "/app/pets", icon: PawPrint },
  { title: "Vaccination Schedule", url: "/app/vaccinations", icon: Syringe },
  { title: "Examinations", url: "/app/examinations", icon: Stethoscope },
  { title: "Services", url: "/app/services", icon: Briefcase },
  { title: "Inventory", url: "/app/inventory", icon: Package },
  { title: "Invoices", url: "/app/invoices", icon: ReceiptText },
  { title: "Reports", url: "/app/reports", icon: BarChart3 },
];

const managementNav = [
  { title: "Users", url: "/app/users", icon: UserCog },
  { title: "Roles & Permissions", url: "/app/roles", icon: ShieldCheck },
  { title: "Website Management", url: "/app/website", icon: Globe },
  { title: "Subscription", url: "/app/subscription", icon: CreditCard },
];

const platformNav = [
  { title: "All Clinics", url: "/app/clinics", icon: Building2 },
  { title: "Onboard Clinic", url: "/app/onboarding", icon: Sparkles },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { clinic } = useClinic();

  const isActive = (url: string) =>
    url === "/app" ? pathname === "/app" || pathname === "/app/" : pathname.startsWith(url);

  const renderItems = (items: typeof clinicNav) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
            <Link to={item.url}>
              <item.icon className="size-4" />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/app" className="flex items-center gap-2.5 px-1.5 py-1">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Heart className="size-5" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {clinic?.name ?? "Vetigo"}
              </span>
              <span className="block truncate text-xs opacity-70">Clinic Panel</span>
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>{renderItems(clinicNav)}</SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(managementNav)}</SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(platformNav)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
