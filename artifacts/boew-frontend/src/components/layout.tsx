import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Terminal, 
  Database, 
  UploadCloud, 
  Search, 
  Clock, 
  Settings, 
  LogOut,
  Server,
  Menu,
  Wifi,
  Palette
} from "lucide-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarProvider,
  SidebarFooter,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ServerConfigDialog } from "@/components/server-config-dialog";
import { ThemeCustomizerDialog } from "@/components/theme-customizer-dialog";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [serverConfigOpen, setServerConfigOpen] = useState(false);
  const [themeCustomizerOpen, setThemeCustomizerOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-sans text-sm safe-area-container flex-col md:flex-row">
        {/* Mobile Top App Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card/90 backdrop-blur-md border-b border-border z-40 sticky top-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="p-1.5 hover:bg-muted/30 text-primary">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-foreground text-sm">
              <div className="p-1 rounded-md bg-primary/10 text-primary">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="font-extrabold tracking-wider bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">BOEW</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setThemeCustomizerOpen(true)}
              title="Theme & Font Customizer"
              className="w-8 h-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <Palette className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setServerConfigOpen(true)}
              className="rounded-lg border-border text-[11px] h-7 px-2.5 bg-muted/20 hover:bg-muted/40 text-muted-foreground flex items-center gap-1"
            >
              <Server className="w-3 h-3 text-primary" />
              <span>SERVER</span>
            </Button>
          </div>
        </header>

        {/* Desktop Sidebar */}
        <Sidebar className="border-r border-border bg-sidebar/95 backdrop-blur-xl">
          <SidebarHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/15 text-primary border border-primary/20 shadow-xs">
                <Terminal className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-wider bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-sm">BOEW_SYS</span>
                <span className="text-[10px] text-muted-foreground font-mono">ENCRYPTED CBIR</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setThemeCustomizerOpen(true)}
                title="Theme & Font Customizer"
                className="w-7 h-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <Palette className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setServerConfigOpen(true)}
                title="Server Endpoint Settings"
                className="w-7 h-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <Wifi className="w-3.5 h-3.5" />
              </Button>
            </div>
          </SidebarHeader>

          <SidebarContent className="py-4">
            <SidebarMenu className="px-2 space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"} className="rounded-lg font-medium transition-all">
                  <Link href="/">
                    <Terminal className="w-4 h-4" />
                    <span>SYSTEM_OVERVIEW</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/dataset"} className="rounded-lg font-medium transition-all">
                  <Link href="/dataset">
                    <Database className="w-4 h-4" />
                    <span>DATASET_REGISTRY</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/upload"} className="rounded-lg font-medium transition-all">
                  <Link href="/upload">
                    <UploadCloud className="w-4 h-4" />
                    <span>DATASET_UPLOAD</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/query"} className="rounded-lg font-medium transition-all">
                  <Link href="/query">
                    <Search className="w-4 h-4" />
                    <span>EXECUTE_QUERY</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/history"} className="rounded-lg font-medium transition-all">
                  <Link href="/history">
                    <Clock className="w-4 h-4" />
                    <span>QUERY_LOGS</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {user?.role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/admin"} className="rounded-lg font-medium transition-all">
                    <Link href="/admin">
                      <Settings className="w-4 h-4" />
                      <span>ADMIN_CONSOLE</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-border flex flex-col gap-2">
            <div className="text-xs text-muted-foreground truncate font-mono">
              USR: {user?.email ?? "GUEST_MODE"}
            </div>
            <button
              onClick={() => setThemeCustomizerOpen(true)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors text-left py-1"
            >
              <Palette className="w-3.5 h-3.5 text-primary" />
              <span>THEME_&_FONTS</span>
            </button>
            <button
              onClick={() => setServerConfigOpen(true)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors text-left py-1"
            >
              <Server className="w-3.5 h-3.5 text-primary" />
              <span>SERVER_CONFIG</span>
            </button>
            {user ? (
              <button
                onClick={logout}
                className="flex items-center gap-2 text-xs text-destructive hover:text-destructive/80 transition-colors text-left py-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>SIGN_OUT</span>
              </button>
            ) : null}
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6 relative">
          {/* Subtle grid background */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.03]" 
            style={{ 
              backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', 
              backgroundSize: '36px 36px' 
            }} 
          />
          <div className="relative z-10 h-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border flex items-center justify-around py-2 px-1 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-lg">
          <Link href="/">
            <button className={`flex flex-col items-center gap-1 px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-colors ${location === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <Terminal className="w-4 h-4" />
              <span>OVERVIEW</span>
            </button>
          </Link>
          <Link href="/query">
            <button className={`flex flex-col items-center gap-1 px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-colors ${location === '/query' || location === '/results' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <Search className="w-4 h-4" />
              <span>QUERY</span>
            </button>
          </Link>
          <Link href="/upload">
            <button className={`flex flex-col items-center gap-1 px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-colors ${location === '/upload' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <UploadCloud className="w-4 h-4" />
              <span>UPLOAD</span>
            </button>
          </Link>
          <Link href="/dataset">
            <button className={`flex flex-col items-center gap-1 px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-colors ${location === '/dataset' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <Database className="w-4 h-4" />
              <span>DATASET</span>
            </button>
          </Link>
          <Link href="/history">
            <button className={`flex flex-col items-center gap-1 px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-colors ${location === '/history' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <Clock className="w-4 h-4" />
              <span>LOGS</span>
            </button>
          </Link>
        </nav>
      </div>

      <ServerConfigDialog
        open={serverConfigOpen}
        onOpenChange={setServerConfigOpen}
      />
      <ThemeCustomizerDialog
        open={themeCustomizerOpen}
        onOpenChange={setThemeCustomizerOpen}
      />
    </SidebarProvider>
  );
}
