import {
  useGetDatasetStats,
  useGetAdminStats,
  useGetMlStatus,
  useListHistory,
  getGetAdminStatsQueryKey,
  getGetMlStatusQueryKey,
  getListHistoryQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import {
  Terminal, Shield, Users, Activity, HardDrive,
  Lock, CheckCircle, XCircle, AlertCircle, Database,
  Cpu, Network, Code, Server,
} from "lucide-react";
import { format } from "date-fns";

function formatBytes(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  if (mb < 1) return `${Math.round(mb * 1024)} KB`;
  return `${mb.toFixed(1)} MB`;
}

function formatTs(iso: string): string {
  try { return format(new Date(iso), "HH:mm:ss"); } catch { return iso; }
}

function formatIndexedAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return format(new Date(iso), "dd MMM yyyy // HH:mm"); } catch { return iso; }
}

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: datasetStats, isLoading: dsLoading } = useGetDatasetStats();

  const { data: adminStats, isLoading: adminLoading } = useGetAdminStats({
    query: {
      enabled: isAdmin,
      retry: false,
      queryKey: getGetAdminStatsQueryKey(),
    },
  });

  const { data: mlStatus, isLoading: mlLoading } = useGetMlStatus({
    query: {
      queryKey: getGetMlStatusQueryKey(),
      retry: false,
    },
  });

  const { data: historyData, isLoading: histLoading } = useListHistory(
    { limit: 5, page: 1 },
    { query: { queryKey: getListHistoryQueryKey({ limit: 5, page: 1 }), retry: false } }
  );

  const mlAny = mlStatus as Record<string, unknown> | undefined;
  const faissAvailable = !!(mlAny?.faissAvailable);
  const extractor: string = typeof mlAny?.extractor === "string"
    ? mlAny.extractor.toUpperCase()
    : mlStatus?.modelLoaded ? "RESNET50" : "HOG+COLOR";
  const featureDims = extractor.includes("HOG") ? "2700" : "2048";

  const gridStyle = {
    backgroundImage:
      "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
  };

  const stat = (val: string | number | null | undefined, loading: boolean) =>
    loading ? "..." : (val ?? "—");

  const totalImages = isAdmin ? adminStats?.totalImages : datasetStats?.totalImages;
  const indexedImages = isAdmin ? adminStats?.indexedImages : datasetStats?.indexedImages;

  const stats = [
    {
      label: "ENCRYPTED_VECTORS",
      val: stat(indexedImages, isAdmin ? adminLoading : dsLoading),
      sub: `OF ${stat(totalImages, isAdmin ? adminLoading : dsLoading)} TOTAL`,
      icon: Database,
    },
    {
      label: "ACTIVE_OPERATIVES",
      val: stat(isAdmin ? adminStats?.totalUsers : null, adminLoading),
      sub: "REGISTERED USERS",
      icon: Users,
    },
    {
      label: "QUERIES_EXECUTED",
      val: stat(isAdmin ? adminStats?.totalRetrievals : null, adminLoading),
      sub: "TOTAL RETRIEVALS",
      icon: Activity,
    },
    {
      label: "AVG_LATENCY",
      val: isAdmin
        ? (adminLoading ? "..." : adminStats?.avgRetrievalTimeMs != null ? `${adminStats.avgRetrievalTimeMs.toFixed(1)}ms` : "—")
        : "—",
      sub: "PER RETRIEVAL",
      icon: Network,
    },
    {
      label: "DATASET_VOLUME",
      val: dsLoading ? "..." : datasetStats?.totalSizeMb != null ? formatBytes(datasetStats.totalSizeMb) : "—",
      sub: "ON ENCRYPTED DISK",
      icon: HardDrive,
    },
  ];

  const recentHistory = historyData?.history ?? [];
  const categories = datasetStats?.categories ?? [];
  const maxCatCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <div className="relative flex flex-col gap-6">
      {/* Subtle grid background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={gridStyle} />

      {/* Page Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-wider">
            <Terminal className="w-5 h-5" />
            <span className="uppercase tracking-widest">SYSTEM_OVERVIEW</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-500 text-xs font-bold tracking-widest">SYS_ONLINE</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="px-3 py-1 border border-border bg-card rounded-sm flex items-center gap-2">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-foreground tracking-widest uppercase">
              OPERATIVE: {user?.role ?? "GUEST"}
            </span>
          </div>
          <div className="px-3 py-1 border border-border bg-card rounded-sm tracking-widest">
            {format(new Date(), "yyyy-MM-dd // HH:mm")} UTC
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-card border border-border p-4 rounded-sm flex flex-col gap-2 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <s.icon className="w-10 h-10 text-primary" />
            </div>
            <div className="text-xs text-primary font-bold tracking-widest">{s.label}</div>
            <div className="text-2xl text-foreground mt-1 font-bold tracking-wide">{s.val}</div>
            <div className="text-xs text-muted-foreground mt-auto pt-2 border-t border-border/50 tracking-widest">
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Main 3-column grid */}
      <div className="relative z-10 grid grid-cols-12 gap-6">

        {/* Col 1: Encryption Status */}
        <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-sm flex flex-col">
          <div className="p-4 border-b border-border bg-background/50 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary tracking-widest">ENCRYPTION_STATUS</span>
          </div>
          <div className="p-4 flex flex-col gap-4 flex-1">
            <StatusRow label="AES-CBC KEY STATUS" value="ACTIVE" color="green" icon="dot" />
            <StatusRow label="KEY DERIVATION" value="SHA-256" color="primary" icon={<CheckCircle className="w-4 h-4 text-primary" />} />
            <StatusRow
              label="SEARCH INDEX"
              value={mlLoading ? "..." : faissAvailable ? "FAISS" : "NUMPY"}
              color={faissAvailable ? "green" : "orange"}
              icon={faissAvailable ? "dot-green" : "alert"}
            />
            <StatusRow
              label="DEEP EXTRACTOR"
              value={mlLoading ? "..." : mlStatus?.modelLoaded ? "RESNET50 ✓" : "OFFLINE"}
              color={mlStatus?.modelLoaded ? "green" : "red"}
              icon={mlStatus?.modelLoaded ? "dot-green" : "dot-red"}
            />
            <StatusRow
              label="HOG EXTRACTOR"
              value={mlLoading ? "..." : !mlStatus?.modelLoaded ? "ACTIVE" : "STANDBY"}
              color={!mlStatus?.modelLoaded ? "green" : "muted"}
              icon={!mlStatus?.modelLoaded ? "dot-green" : "dot-muted"}
            />
            <StatusRow
              label="ENCRYPTION ENGINE"
              value={mlLoading ? "..." : mlStatus?.encryptionEnabled !== false ? "READY" : "DISABLED"}
              color={mlStatus?.encryptionEnabled !== false ? "green" : "red"}
              icon={mlStatus?.encryptionEnabled !== false ? "dot-green" : "dot-red"}
            />

            <div className="mt-2 pt-4 border-t border-border flex flex-col gap-1">
              <span className="text-xs text-muted-foreground tracking-widest">LAST INDEX REBUILD</span>
              <span className="text-sm font-mono">
                {mlLoading ? "..." : formatIndexedAt(mlStatus?.lastIndexedAt)}
              </span>
            </div>

            <div className="mt-auto pt-4 flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-primary font-bold tracking-widest">ENCRYPTION_INTEGRITY</span>
                <span>100%</span>
              </div>
              <div className="h-1 w-full bg-background rounded-full overflow-hidden">
                <div className="h-full bg-primary w-full shadow-[0_0_8px_rgba(0,128,255,0.6)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Col 2: Recent Retrievals */}
        <div className="col-span-12 lg:col-span-5 bg-card border border-border rounded-sm flex flex-col">
          <div className="p-4 border-b border-border bg-background/50 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary tracking-widest">RECENT_RETRIEVALS</span>
          </div>
          <div className="flex-1 overflow-x-auto">
            {histLoading ? (
              <div className="p-6 text-xs text-muted-foreground tracking-widest text-center animate-pulse">
                LOADING_HISTORY...
              </div>
            ) : recentHistory.length === 0 ? (
              <div className="p-6 text-xs text-muted-foreground tracking-widest text-center">
                NO_RETRIEVALS_YET — EXECUTE A QUERY TO BEGIN
              </div>
            ) : (
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-background/80 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-normal tracking-wider">TIMESTAMP</th>
                    <th className="px-4 py-3 font-normal tracking-wider">QUERY_ID</th>
                    <th className="px-4 py-3 font-normal tracking-wider">METRIC</th>
                    <th className="px-4 py-3 font-normal tracking-wider">RESULTS</th>
                    <th className="px-4 py-3 font-normal tracking-wider">TIME</th>
                    <th className="px-4 py-3 font-normal tracking-wider">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentHistory.map((row) => (
                    <tr key={row.id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{formatTs(row.createdAt)}</td>
                      <td className="px-4 py-3 font-bold text-foreground">Q_{String(row.id).padStart(4, "0")}</td>
                      <td className="px-4 py-3 text-muted-foreground uppercase">{row.metric}</td>
                      <td className="px-4 py-3 text-primary">{row.resultCount}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.retrievalTimeMs.toFixed(1)}ms</td>
                      <td className="px-4 py-3">
                        <span className="text-green-500 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> COMPLETED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Col 3: Dataset Distribution */}
        <div className="col-span-12 lg:col-span-3 bg-card border border-border rounded-sm flex flex-col">
          <div className="p-4 border-b border-border bg-background/50 flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary tracking-widest">DATASET_DIST</span>
          </div>
          <div className="p-4 flex flex-col gap-4 flex-1">
            {dsLoading ? (
              <div className="text-xs text-muted-foreground tracking-widest animate-pulse">SCANNING...</div>
            ) : categories.length === 0 ? (
              <div className="text-xs text-muted-foreground tracking-widest">NO_DATA_AVAILABLE</div>
            ) : (
              categories.map((cat) => (
                <div key={cat.name} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs tracking-widest">
                    <span className="uppercase text-foreground">{cat.name || "UNCLASSIFIED"}</span>
                    <span className="text-muted-foreground">{cat.count}</span>
                  </div>
                  <div className="relative h-2 w-full bg-background border border-border/50 overflow-hidden rounded-sm">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary rounded-sm"
                      style={{
                        width: `${(cat.count / maxCatCount) * 100}%`,
                        boxShadow: "0 0 8px rgba(0,128,255,0.5)",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="relative z-10 border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4" />
          <span className="tracking-widest">
            BOEW_ENGINE v1.0 // ENCRYPTED RETRIEVAL ACTIVE // {extractor} FEATURES: {featureDims} DIMS
          </span>
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-card border border-border rounded-sm text-primary tracking-widest">
            [ENCRYPTION: AES-CBC]
          </span>
          <span className="px-2 py-1 bg-card border border-border rounded-sm text-primary tracking-widest">
            [SEARCH: COSINE]
          </span>
          <span className="px-2 py-1 bg-card border border-border rounded-sm text-primary tracking-widest">
            {faissAvailable ? "[INDEX: FAISS]" : "[INDEX: NUMPY]"}
          </span>
        </div>
      </div>
    </div>
  );
}

type StatusColor = "green" | "orange" | "red" | "primary" | "muted";

function StatusRow({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: StatusColor;
  icon: "dot" | "dot-green" | "dot-red" | "dot-muted" | "alert" | React.ReactNode;
}) {
  const colorClass: Record<StatusColor, string> = {
    green: "text-green-500",
    orange: "text-orange-400",
    red: "text-red-500",
    primary: "text-primary",
    muted: "text-muted-foreground",
  };

  const renderIcon = () => {
    if (icon === "dot" || icon === "dot-green")
      return <div className="w-2 h-2 rounded-full bg-green-500" />;
    if (icon === "dot-red") return <div className="w-2 h-2 rounded-full bg-red-500" />;
    if (icon === "dot-muted") return <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />;
    if (icon === "alert") return <AlertCircle className="w-4 h-4 text-orange-400" />;
    return icon;
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground text-xs tracking-wider">{label}</span>
      <div className={`flex items-center gap-2 font-bold text-xs tracking-widest ${colorClass[color]}`}>
        <span>{value}</span>
        {renderIcon()}
      </div>
    </div>
  );
}
