import React from 'react';
import { 
  Terminal, Shield, Users, Activity, HardDrive, 
  Lock, CheckCircle, XCircle, AlertCircle, Database,
  Cpu, Network, Code, Server
} from 'lucide-react';

export default function Dashboard() {
  const theme = {
    '--background': '220 10% 4%',
    '--foreground': '0 0% 95%',
    '--primary': '210 100% 50%',
    '--card': '220 10% 7%',
    '--border': '220 10% 15%',
    '--muted-foreground': '220 10% 55%',
  } as React.CSSProperties;

  const gridStyle = {
    backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
    backgroundSize: '40px 40px'
  };

  return (
    <div style={theme} className="min-h-screen bg-background text-foreground font-mono overflow-hidden relative flex flex-col p-6 gap-6">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20" 
        style={gridStyle}
      />

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-wider">
            <Terminal className="w-6 h-6" />
            <span>{`>_ BOEW_SYS`}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-500 text-xs font-bold">ONLINE</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="px-3 py-1 border border-border bg-card rounded-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-foreground">OPERATIVE: ADMIN</span>
          </div>
          <div className="px-3 py-1 border border-border bg-card rounded-sm">
            2026-06-09 // 17:33 UTC
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div className="relative z-10 grid grid-cols-5 gap-4">
        {[
          { label: 'ENCRYPTED_VECTORS', val: '2,847', sub: 'IN AES-CBC INDEX', icon: Database },
          { label: 'ACTIVE_OPERATIVES', val: '12', sub: 'REGISTERED USERS', icon: Users },
          { label: 'QUERIES_EXECUTED', val: '1,429', sub: 'TOTAL RETRIEVALS', icon: Activity },
          { label: 'AVG_LATENCY', val: '8.3ms', sub: 'LAST 24H', icon: Network },
          { label: 'DATASET_SIZE', val: '4.2 GB', sub: 'ENCRYPTED ON DISK', icon: HardDrive },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border p-4 rounded-sm flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="w-12 h-12 text-primary" />
            </div>
            <div className="text-xs text-primary font-bold tracking-widest">{stat.label}</div>
            <div className="text-3xl text-foreground mt-1">{stat.val}</div>
            <div className="text-xs text-muted-foreground mt-auto pt-2 border-t border-border/50">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 grid grid-cols-12 gap-6 min-h-[400px]">
        
        {/* Column 1: ENCRYPTION_STATUS */}
        <div className="col-span-4 bg-card border border-border rounded-sm flex flex-col">
          <div className="p-4 border-b border-border bg-background/50 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary tracking-widest">ENCRYPTION_STATUS</span>
          </div>
          <div className="p-4 flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">AES-CBC KEY STATUS</span>
              <div className="flex items-center gap-2">
                <span className="text-green-500">ACTIVE</span>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">KEY DERIVATION</span>
              <div className="flex items-center gap-2 text-foreground">
                <span>SHA-256</span>
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">FAISS FALLBACK</span>
              <div className="flex items-center gap-2">
                <span className="text-orange-400">NumPy</span>
                <AlertCircle className="w-4 h-4 text-orange-400" />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">TF EXTRACTOR</span>
              <div className="flex items-center gap-2">
                <span className="text-red-500">OFFLINE</span>
                <div className="w-2 h-2 rounded-full bg-red-500" />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">HOG EXTRACTOR</span>
              <div className="flex items-center gap-2">
                <span className="text-green-500">ACTIVE</span>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">LAST INDEX REBUILD</span>
              <span className="text-sm">03 JUN 2026 // 17:33</span>
            </div>

            <div className="mt-auto pt-4 flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-primary font-bold">ENCRYPTION_INTEGRITY</span>
                <span>100%</span>
              </div>
              <div className="h-1 w-full bg-background rounded-full overflow-hidden">
                <div className="h-full bg-primary w-full shadow-[0_0_10px_rgba(0,128,255,0.8)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: RECENT_RETRIEVALS */}
        <div className="col-span-5 bg-card border border-border rounded-sm flex flex-col">
          <div className="p-4 border-b border-border bg-background/50 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary tracking-widest">RECENT_RETRIEVALS</span>
          </div>
          <div className="flex-1 p-0 overflow-x-auto">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead className="bg-background/80 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-normal">TIMESTAMP</th>
                  <th className="px-4 py-3 font-normal">QUERY_ID</th>
                  <th className="px-4 py-3 font-normal">TOP_MATCH</th>
                  <th className="px-4 py-3 font-normal">SIM_SCORE</th>
                  <th className="px-4 py-3 font-normal">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { t: '17:33:01', id: 'Q_98X2', m: 'IMG_4401', s: '0.942', st: 'COMPLETED' },
                  { t: '17:32:45', id: 'Q_98X1', m: 'IMG_1102', s: '0.881', st: 'COMPLETED' },
                  { t: '17:30:12', id: 'Q_98X0', m: '---', s: '---', st: 'PROCESSING' },
                  { t: '17:28:55', id: 'Q_98W9', m: 'IMG_9921', s: '0.710', st: 'COMPLETED' },
                  { t: '17:21:04', id: 'Q_98W8', m: 'IMG_5504', s: '0.998', st: 'COMPLETED' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{row.t}</td>
                    <td className="px-4 py-3 font-bold">{row.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.m}</td>
                    <td className="px-4 py-3 text-primary">{row.s}</td>
                    <td className="px-4 py-3">
                      {row.st === 'COMPLETED' ? (
                        <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> COMPLETED</span>
                      ) : (
                        <span className="text-yellow-500 flex items-center gap-1 animate-pulse"><Server className="w-3 h-3"/> PROCESSING</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 3: DATASET_DISTRIBUTION */}
        <div className="col-span-3 bg-card border border-border rounded-sm flex flex-col">
          <div className="p-4 border-b border-border bg-background/50 flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary tracking-widest">DATASET_DISTRIBUTION</span>
          </div>
          <div className="p-4 flex flex-col gap-4 flex-1">
            {[
              { cat: 'CYBERSEC', count: 847, max: 1000 },
              { cat: 'SATELLITE', count: 623, max: 1000 },
              { cat: 'BIOMETRIC', count: 512, max: 1000 },
              { cat: 'MEDICAL', count: 401, max: 1000 },
              { cat: 'FORENSICS', count: 298, max: 1000 },
              { cat: 'UNCLASSIFIED', count: 166, max: 1000 },
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground">{item.cat}</span>
                  <span className="text-muted-foreground">{item.count} images</span>
                </div>
                <div className="flex items-center">
                  <div 
                    className="h-2 bg-primary shadow-[0_0_8px_rgba(0,128,255,0.6)] rounded-sm"
                    style={{ width: `${(item.count / item.max) * 100}%` }}
                  />
                  <div className="flex-1 h-2 bg-background border border-border rounded-sm -ml-1 z-[-1]" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <footer className="relative z-10 mt-auto border-t border-border pt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4" />
          <span>BOEW_ENGINE v1.0 // ENCRYPTED RETRIEVAL ACTIVE // HOG+COLOR FEATURES: 2700 DIMS</span>
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-card border border-border rounded-sm text-primary">[ENCRYPTION: AES-CBC]</span>
          <span className="px-2 py-1 bg-card border border-border rounded-sm text-primary">[SEARCH: COSINE]</span>
          <span className="px-2 py-1 bg-card border border-border rounded-sm text-primary">[INDEX: NUMPY]</span>
        </div>
      </footer>
    </div>
  );
}
