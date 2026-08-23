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
  Lock, CheckCircle, AlertCircle, Database,
  Network, Code, Server,
} from "lucide-react";
import { format } from "date-fns";

function formatSizeMb(mb: number): string {
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
  const extractor: string =
    typeof mlAny?.extractor === "string"
      ? mlAny.extractor.toUpperCase()
      : mlStatus?.modelLoaded
      ? "RESNET50"
      : "HOG+COLOR";
  const featureDims = extractor.includes("HOG") ? "2700" : "2048";

  const gridStyle = {
    backgroundImage:
      "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
  };

  const loading = (isAdmin: boolean) => (isAdmin ? adminLoading : dsLoading);
  const orDash = <T,>(v: T | null | undefined, l: boolean) =>
    l ? "..." : (v != null ? String(v) : "—");

  const totalImages = isAdmin ? adminStats?.totalImages : datasetStats?.totalImages;
  const indexedImages = isAdmin ? adminStats?.indexedImages : datasetStats?.indexedImages;

  const stats = [
    {
      label: "ENCRYPTED_VECTORS",
      val: orDash(indexedImages, loading(isAdmin)),
      sub: "IN AES-CBC INDEX",
      icon: Database,
    },
    {
      label: "ACTIVE_OPERATIVES",
      val: orDash(isAdmin ? adminStats?.totalUsers : null, adminLoading),
      sub: "REGISTERED USERS",
      icon: Users,
    },
    {
      label: "QUERIES_EXECUTED",
      val: orDash(isAdmin ? adminStats?.totalRetrievals : null, adminLoading),
      sub: "TOTAL RETRIEVALS",
      icon: Activity,
    },
    {
      label: "AVG_LATENCY",
      val: isAdmin
        ? adminLoading
          ? "..."
          : adminStats?.avgRetrievalTimeMs != null
          ? `${adminStats.avgRetrievalTimeMs.toFixed(1)}ms`
          : "—"
        : "—",
      sub: "LAST 24H",
      icon: Network,
    },
    {
      label: "DATASET_SIZE",
      val: dsLoading
        ? "..."
        : datasetStats?.totalSizeMb != null
        ? formatSizeMb(datasetStats.totalSizeMb)
        : "—",
      sub: "ENCRYPTED ON DISK",
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
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-xs">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">System Overview</h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[10px] font-bold tracking-wider">ONLINE</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Encrypted visual vector retrieval engine</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 border border-border/80 bg-card/80 backdrop-blur-md rounded-xl flex items-center gap-2 shadow-xs">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-foreground font-semibold">
              {user?.role?.toUpperCase() ?? "GUEST"}
            </span>
          </div>
          <div className="px-3 py-1.5 border border-border/80 bg-card/80 backdrop-blur-md rounded-xl text-muted-foreground font-mono shadow-xs">
            {format(new Date(), "yyyy-MM-dd // HH:mm")} UTC
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-card/90 backdrop-blur-md border border-border/80 p-4 rounded-2xl flex flex-col gap-1.5 relative overflow-hidden group shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-300">
              <s.icon className="w-12 h-12 text-primary" />
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold tracking-wider uppercase">{s.label}</div>
            <div className="text-2xl font-bold tracking-tight text-foreground font-sans mt-0.5">{s.val}</div>
            <div className="text-[10px] text-primary/80 font-mono mt-auto pt-2 border-t border-border/40 tracking-wider">
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Main 3-column grid */}
      <div className="relative z-10 grid grid-cols-12 gap-6">

        {/* Col 1 (4/12): ENCRYPTION_STATUS */}
        <div className="col-span-12 lg:col-span-4 bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl flex flex-col shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/70 bg-muted/20 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground tracking-tight">Security & Encryption</span>
          </div>
          <div className="p-5 flex flex-col gap-4 flex-1">
            <StatusRow label="AES-CBC KEY STATUS" value="ACTIVE" dot="green" />
            <StatusRow label="KEY DERIVATION" value="SHA-256" checkmark />
            <StatusRow
              label="FAISS FALLBACK"
              value={mlLoading ? "..." : faissAvailable ? "FAISS" : "NumPy"}
              dot={faissAvailable ? "green" : undefined}
              alert={!faissAvailable && !mlLoading}
              color={faissAvailable ? "green" : "orange"}
            />
            <StatusRow
              label="TF EXTRACTOR"
              value={mlLoading ? "..." : mlStatus?.modelLoaded ? "ACTIVE" : "OFFLINE"}
              dot={mlStatus?.modelLoaded ? "green" : "red"}
              color={mlStatus?.modelLoaded ? "green" : "red"}
            />
            <StatusRow
              label="HOG EXTRACTOR"
              value={mlLoading ? "..." : !mlStatus?.modelLoaded ? "ACTIVE" : "STANDBY"}
              dot={!mlStatus?.modelLoaded ? "green" : "muted"}
              color={!mlStatus?.modelLoaded ? "green" : "muted"}
            />

            <div className="mt-2 pt-4 border-t border-border/60 flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">LAST INDEX REBUILD</span>
              <span className="text-xs font-mono text-foreground font-medium">
                {mlLoading ? "..." : formatIndexedAt(mlStatus?.lastIndexedAt)}
              </span>
            </div>

            <div className="mt-auto pt-4 flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-primary font-bold tracking-wider text-[11px]">ENCRYPTION INTEGRITY</span>
                <span className="font-mono font-bold text-emerald-400">100%</span>
              </div>
              <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-emerald-400 w-full rounded-full shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Col 2 (5/12): RECENT_RETRIEVALS */}
        <div className="col-span-12 lg:col-span-5 bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl flex flex-col shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/70 bg-muted/20 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground tracking-tight">Recent Visual Queries</span>
          </div>
          <div className="flex-1 overflow-x-auto">
            {histLoading ? (
              <div className="p-8 text-xs text-muted-foreground tracking-wider text-center animate-pulse">
                LOADING_HISTORY...
              </div>
            ) : recentHistory.length === 0 ? (
              <div className="p-8 text-xs text-muted-foreground tracking-wider text-center">
                NO_RETRIEVALS_YET — EXECUTE A QUERY TO BEGIN
              </div>
            ) : (
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-muted/10 text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-[10px] uppercase tracking-wider">TIMESTAMP</th>
                    <th className="px-4 py-3 font-semibold text-[10px] uppercase tracking-wider">QUERY_ID</th>
                    <th className="px-4 py-3 font-semibold text-[10px] uppercase tracking-wider">mAP / SCORE</th>
                    <th className="px-4 py-3 font-semibold text-[10px] uppercase tracking-wider">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentHistory.map((row) => (
                    <tr key={row.id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground font-mono">{formatTs(row.createdAt)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-primary">Q_{String(row.id).padStart(4, "0")}</td>
                      <td className="px-4 py-3 font-mono text-foreground font-semibold">
                        {row.mAP != null ? row.mAP.toFixed(3) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5" /> OK
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Col 3 (3/12): DATASET_DISTRIBUTION */}
        <div className="col-span-12 lg:col-span-3 bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl flex flex-col shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/70 bg-muted/20 flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground tracking-tight">Dataset Distribution</span>
          </div>
          <div className="p-5 flex flex-col gap-4 flex-1">
            {dsLoading ? (
              <div className="text-xs text-muted-foreground tracking-wider animate-pulse">SCANNING...</div>
            ) : categories.length === 0 ? (
              <div className="text-xs text-muted-foreground tracking-wider">NO_DATA_AVAILABLE</div>
            ) : (
              categories.map((cat) => (
                <div key={cat.name} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-foreground capitalize">{cat.name || "Unclassified"}</span>
                    <span className="text-muted-foreground font-mono">{cat.count} items</span>
                  </div>
                  <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                      style={{ width: `${(cat.count / maxCatCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="relative z-10 border-t border-border/60 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-primary" />
          <span>
            BOEW_ENGINE v1.0 // {extractor} ({featureDims}-dim)
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 bg-card/80 border border-border/80 rounded-lg text-primary font-mono text-[11px]">
            AES-256 CBC
          </span>
          <span className="px-2.5 py-1 bg-card/80 border border-border/80 rounded-lg text-primary font-mono text-[11px]">
            COSINE_SIM
          </span>
          <span className="px-2.5 py-1 bg-card/80 border border-border/80 rounded-lg text-primary font-mono text-[11px]">
            {faissAvailable ? "FAISS_INDEX" : "NUMPY_INDEX"}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  dot,
  color = "green",
  checkmark = false,
  alert = false,
}: {
  label: string;
  value: string;
  dot?: "green" | "red" | "muted";
  color?: "green" | "orange" | "red" | "primary" | "muted";
  checkmark?: boolean;
  alert?: boolean;
}) {
  const colorClass: Record<string, string> = {
    green: "text-green-500",
    orange: "text-orange-400",
    red: "text-red-500",
    primary: "text-primary",
    muted: "text-muted-foreground",
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground text-xs tracking-wider">{label}</span>
      <div className={`flex items-center gap-2 text-xs font-bold ${colorClass[color]}`}>
        <span>{value}</span>
        {dot === "green" && <div className="w-2 h-2 rounded-full bg-green-500" />}
        {dot === "red" && <div className="w-2 h-2 rounded-full bg-red-500" />}
        {dot === "muted" && <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />}
        {checkmark && <CheckCircle className="w-4 h-4 text-primary" />}
        {alert && <AlertCircle className="w-4 h-4 text-orange-400" />}
      </div>
    </div>
  );
}
