import { useGetDatasetStats, useGetAdminStats, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Database, Users, Cpu, ShieldCheck } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const { data: datasetStats, isLoading: isLoadingDataset } = useGetDatasetStats();
  const { data: adminStats, isLoading: isLoadingAdmin } = useGetAdminStats({
    query: {
      enabled: user?.role === "admin",
      retry: false,
      queryKey: getGetAdminStatsQueryKey(),
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-widest text-primary uppercase">SYSTEM_OVERVIEW</h1>
          <p className="text-muted-foreground text-xs tracking-wider mt-1">BAG OF ENCRYPTED WORDS (BOEW) // TERMINAL</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest bg-primary/10 text-primary px-3 py-1 border border-primary/20">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          SYS_ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-none border-border bg-card shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold tracking-widest text-muted-foreground uppercase">OPERATIVE_ROLE</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold uppercase tracking-widest text-primary">{user?.role}</div>
            <p className="text-xs text-muted-foreground mt-1">CLEARANCE LEVEL</p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border bg-card shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold tracking-widest text-muted-foreground uppercase">INDEXED_VECTORS</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tracking-widest">{isLoadingDataset ? "..." : datasetStats?.indexedImages || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">OF {isLoadingDataset ? "..." : datasetStats?.totalImages || 0} TOTAL</p>
          </CardContent>
        </Card>

        {user?.role === "admin" && (
          <>
            <Card className="rounded-none border-border bg-card shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold tracking-widest text-muted-foreground uppercase">ACTIVE_USERS</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold tracking-widest">{isLoadingAdmin ? "..." : adminStats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">REGISTERED</p>
              </CardContent>
            </Card>

            <Card className="rounded-none border-border bg-card shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold tracking-widest text-muted-foreground uppercase">TOTAL_QUERIES</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold tracking-widest">{isLoadingAdmin ? "..." : adminStats?.totalRetrievals || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">EXECUTED</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="rounded-none border-border bg-card shadow-md flex flex-col">
          <CardHeader className="border-b border-border bg-muted/20">
            <CardTitle className="text-sm font-bold tracking-widest uppercase">DATASET_DISTRIBUTION</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1">
            {isLoadingDataset ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">SCANNING...</div>
            ) : (
              <div className="space-y-4">
                {datasetStats?.categories?.map((cat) => (
                  <div key={cat.name} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs tracking-widest">
                      <span className="uppercase text-foreground">{cat.name || 'UNCLASSIFIED'}</span>
                      <span className="text-primary">{cat.count}</span>
                    </div>
                    <div className="h-1 w-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(cat.count / (datasetStats.totalImages || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {!datasetStats?.categories?.length && (
                  <div className="text-xs text-muted-foreground tracking-widest">NO_DATA_AVAILABLE</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-none border-border bg-card shadow-md">
          <CardHeader className="border-b border-border bg-muted/20">
            <CardTitle className="text-sm font-bold tracking-widest uppercase">SYSTEM_CAPABILITIES</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-sm text-muted-foreground space-y-4">
            <p>
              The BOEW (Bag-of-Encrypted-Words) system provides a secure retrieval environment for sensitive visual datasets. Features are extracted, quantized, and encrypted before indexing.
            </p>
            <ul className="space-y-2 list-disc pl-4 text-xs tracking-widest uppercase">
              <li>End-to-End Feature Encryption</li>
              <li>Sub-linear Retrieval Time</li>
              <li>Homomorphic Distance Computation</li>
              <li>High-Precision AI Feature Extraction</li>
            </ul>
            <div className="pt-4 border-t border-border mt-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold tracking-widest text-primary">ENCRYPTION_ENGINE_READY</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
