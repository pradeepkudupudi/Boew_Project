import { Link } from "wouter";
import { Terminal } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background font-mono text-sm relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-5"
           style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 text-center space-y-6 p-8 border border-border bg-card shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-center gap-3 border-b border-border pb-4">
          <Terminal className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold tracking-widest text-primary">BOEW_SYS</span>
        </div>

        <div className="space-y-2">
          <div className="text-6xl font-bold tracking-widest text-primary/30">404</div>
          <div className="text-sm font-bold tracking-widest text-primary uppercase">PAGE_NOT_FOUND</div>
          <p className="text-xs text-muted-foreground tracking-widest mt-2">
            REQUESTED_ROUTE_DOES_NOT_EXIST
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full h-10 bg-primary text-primary-foreground text-xs font-bold tracking-widest uppercase hover:bg-primary/90 transition-colors"
        >
          RETURN_TO_BASE
        </Link>
      </div>
    </div>
  );
}
