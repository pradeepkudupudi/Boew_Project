import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Terminal, 
  Database, 
  UploadCloud, 
  Search, 
  Clock, 
  Settings, 
  LogOut 
} from "lucide-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarProvider,
  SidebarFooter
} from "@/components/ui/sidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-mono text-sm">
        <Sidebar className="border-r border-border bg-card">
          <SidebarHeader className="p-4 border-b border-border flex flex-row items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            <span className="font-bold tracking-widest text-primary">BOEW_SYS</span>
          </SidebarHeader>
          <SidebarContent className="py-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"}>
                  <Link href="/">
                    <Terminal />
                    <span>SYSTEM_OVERVIEW</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/dataset"}>
                  <Link href="/dataset">
                    <Database />
                    <span>DATASET_REGISTRY</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/upload"}>
                  <Link href="/upload">
                    <UploadCloud />
                    <span>DATASET_UPLOAD</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/query"}>
                  <Link href="/query">
                    <Search />
                    <span>EXECUTE_QUERY</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/history"}>
                  <Link href="/history">
                    <Clock />
                    <span>QUERY_LOGS</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {user?.role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/admin"}>
                    <Link href="/admin">
                      <Settings />
                      <span>ADMIN_CONSOLE</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border flex flex-col gap-2">
            <div className="text-xs text-muted-foreground truncate">
              USR: {user?.email ?? "GUEST_MODE"}
            </div>
            <div className="flex items-center gap-2 text-primary">
              <LogOut className="w-4 h-4" />
              <span>PUBLIC_ACCESS</span>
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 overflow-auto p-6 relative">
          {/* Subtle grid background to reinforce terminal vibe */}
          <div className="absolute inset-0 pointer-events-none opacity-5" 
               style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative z-10 h-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
