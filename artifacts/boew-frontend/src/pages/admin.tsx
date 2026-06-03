import { useGetAdminStats, useGetMlStatus, useRebuildIndex, getGetAdminStatsQueryKey, getGetMlStatusQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, ShieldAlert, Cpu, HardDrive, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function Admin() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: mlStatus, isLoading: mlLoading } = useGetMlStatus();
  const rebuildMutation = useRebuildIndex();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRebuild = () => {
    if (!confirm("WARNING: REBUILDING INDEX IS COMPUTATIONALLY EXPENSIVE. PROCEED?")) return;
    
    rebuildMutation.mutate(undefined, {
      onSuccess: (data) => {
        toast({ title: "INDEX_REBUILT", description: `Re-indexed ${data.indexedCount} vectors.` });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMlStatusQueryKey() });
      },
      onError: (err) => {
        toast({ title: "REBUILD_FAILED", description: (err.data as { error?: string })?.error || "Unknown error", variant: "destructive" });
      }
    });
  };

  const chartData = stats?.recentActivity.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    retrievals: item.retrievals
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-widest text-primary uppercase flex items-center gap-3">
            <ShieldAlert className="w-6 h-6" /> ADMIN_CONSOLE
          </h1>
          <p className="text-muted-foreground text-xs tracking-wider mt-1 text-destructive">RESTRICTED ACCESS AREA</p>
        </div>
        <Button 
          variant="outline" 
          className="rounded-none border-primary text-primary hover:bg-primary/20 tracking-widest uppercase text-xs"
          onClick={handleRebuild}
          disabled={rebuildMutation.isPending}
        >
          <RefreshCw className={`w-3 h-3 mr-2 ${rebuildMutation.isPending ? 'animate-spin' : ''}`} />
          {rebuildMutation.isPending ? 'REBUILDING...' : 'REBUILD_INDEX'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-none border-border bg-card shadow-md">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 border border-primary/30 text-primary">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs tracking-widest text-muted-foreground uppercase mb-1">ML_ENGINE_STATUS</div>
              <div className="text-lg font-bold tracking-widest text-primary flex items-center gap-2">
                {mlLoading ? "..." : mlStatus?.online ? "ONLINE" : "OFFLINE"}
                {mlStatus?.online && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border bg-card shadow-md">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-muted/20 border border-border text-muted-foreground">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs tracking-widest text-muted-foreground uppercase mb-1">INDEX_SIZE</div>
              <div className="text-lg font-bold tracking-widest">
                {mlLoading ? "..." : mlStatus?.indexSize || 0} <span className="text-xs text-muted-foreground">VECTORS</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border bg-card shadow-md">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-muted/20 border border-border text-muted-foreground">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs tracking-widest text-muted-foreground uppercase mb-1">AVG_LATENCY</div>
              <div className="text-lg font-bold tracking-widest">
                {statsLoading ? "..." : stats?.avgRetrievalTimeMs.toFixed(1) || 0} <span className="text-xs text-muted-foreground">ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-none border-border bg-card shadow-md flex flex-col">
          <CardHeader className="border-b border-border bg-muted/20 pb-3">
            <CardTitle className="text-sm font-bold tracking-widest uppercase">RETRIEVAL_VOLUME (7D)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 h-[300px]">
            {statsLoading ? (
              <div className="w-full h-full flex items-center justify-center animate-pulse tracking-widest text-xs text-muted-foreground">LOADING_TELEMETRY...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRetrievals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '0', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                  />
                  <Area type="monotone" dataKey="retrievals" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRetrievals)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-none border-border bg-card shadow-md flex flex-col">
          <CardHeader className="border-b border-border bg-muted/20 pb-3">
            <CardTitle className="text-sm font-bold tracking-widest uppercase">SYSTEM_METRICS</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs tracking-widest text-muted-foreground uppercase">
                <span>GLOBAL_mAP</span>
                <span className="text-primary font-bold">{(stats?.avgPrecision ? stats.avgPrecision * 100 : 0).toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-muted w-full relative">
                <div className="absolute inset-y-0 left-0 bg-primary" style={{width: `${(stats?.avgPrecision || 0) * 100}%`}}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs tracking-widest text-muted-foreground uppercase">
                <span>GLOBAL_RECALL</span>
                <span className="text-primary font-bold">{(stats?.avgRecall ? stats.avgRecall * 100 : 0).toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-muted w-full relative">
                <div className="absolute inset-y-0 left-0 bg-primary" style={{width: `${(stats?.avgRecall || 0) * 100}%`}}></div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-border space-y-3">
              <div className="flex justify-between text-xs tracking-widest font-mono">
                <span className="text-muted-foreground">MODEL_LOADED</span>
                <span className={mlStatus?.modelLoaded ? "text-primary" : "text-destructive"}>{mlStatus?.modelLoaded ? "TRUE" : "FALSE"}</span>
              </div>
              <div className="flex justify-between text-xs tracking-widest font-mono">
                <span className="text-muted-foreground">ENCRYPTION</span>
                <span className={mlStatus?.encryptionEnabled ? "text-primary" : "text-destructive"}>{mlStatus?.encryptionEnabled ? "ACTIVE" : "DISABLED"}</span>
              </div>
              <div className="flex justify-between text-xs tracking-widest font-mono">
                <span className="text-muted-foreground">LAST_INDEX_UPDATE</span>
                <span className="text-foreground text-right">{mlStatus?.lastIndexedAt ? format(new Date(mlStatus.lastIndexedAt), 'yyyy-MM-dd HH:mm') : 'NEVER'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
