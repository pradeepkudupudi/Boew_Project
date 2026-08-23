import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Zap, Target, Gauge, Maximize } from "lucide-react";
import { resolveApiUrl } from "@/lib/api-config";
import type { RetrievalResult } from "@workspace/api-client-react";

export default function Results() {
  const [location, setLocation] = useLocation();
  const [result, setResult] = useState<RetrievalResult | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("boew_last_result");
    if (data) {
      try {
        setResult(JSON.parse(data));
      } catch (e) {
        console.error("Failed to parse results");
        setLocation("/query");
      }
    } else {
      setLocation("/query");
    }
  }, [setLocation]);

  if (!result) {
    return <div className="p-8 text-primary font-mono tracking-widest animate-pulse">RECONSTRUCTING_DATA...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="rounded-none border-border" onClick={() => setLocation("/query")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-primary uppercase">RETRIEVAL_RESULTS</h1>
            <p className="text-muted-foreground text-xs tracking-wider mt-1">OP_ID: {result.historyId.toString().padStart(8, '0')}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground tracking-widest">COMPUTATION_TIME</span>
            <span className="text-sm font-bold text-primary flex items-center gap-1">
              <Clock className="w-3 h-3" /> {result.retrievalTimeMs}ms
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Query Info & Metrics */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="rounded-none border-border bg-card shadow-md">
            <CardHeader className="border-b border-border bg-muted/20 pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                <Target className="w-3 h-3 text-primary" /> TARGET_VECTOR
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 border-b border-border">
              <div className="aspect-square relative bg-black flex items-center justify-center p-2">
                <img 
                  src={resolveApiUrl(result.queryImagePath.startsWith('/api') ? result.queryImagePath : `/api/uploads/${result.queryImagePath.split('/').pop()}`)} 
                  alt="Query" 
                  className="max-w-full max-h-full object-contain border border-primary/30"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-border bg-card shadow-md">
            <CardHeader className="border-b border-border bg-muted/20 pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                <Gauge className="w-3 h-3 text-primary" /> PERFORMANCE_METRICS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] tracking-widest">
                  <span className="text-muted-foreground">PRECISION</span>
                  <span className="text-primary font-bold">{(result.metrics.precision * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1 bg-muted w-full"><div className="h-full bg-primary" style={{width: `${result.metrics.precision * 100}%`}}></div></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] tracking-widest">
                  <span className="text-muted-foreground">RECALL</span>
                  <span className="text-primary font-bold">{(result.metrics.recall * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1 bg-muted w-full"><div className="h-full bg-primary" style={{width: `${result.metrics.recall * 100}%`}}></div></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] tracking-widest">
                  <span className="text-muted-foreground">F1_SCORE</span>
                  <span className="text-primary font-bold">{(result.metrics.f1Score * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1 bg-muted w-full"><div className="h-full bg-primary" style={{width: `${result.metrics.f1Score * 100}%`}}></div></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] tracking-widest">
                  <span className="text-muted-foreground">mAP</span>
                  <span className="text-primary font-bold">{(result.metrics.mAP * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1 bg-muted w-full"><div className="h-full bg-primary" style={{width: `${result.metrics.mAP * 100}%`}}></div></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results Grid */}
        <div className="lg:col-span-9">
          <Card className="rounded-none border-border bg-card shadow-md h-full flex flex-col">
            <CardHeader className="border-b border-border bg-muted/20 pb-2 pt-3 px-4 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                <Zap className="w-3 h-3 text-primary" /> MATCHES_FOUND ({result.results.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {result.results.map((match) => (
                  <div key={match.imageId} className="group relative border border-border bg-background flex flex-col">
                    <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 z-10 tracking-widest">
                      #{match.rank}
                    </div>
                    <div className="aspect-square bg-muted/10 relative overflow-hidden border-b border-border">
                      <img 
                        src={resolveApiUrl(`/api/images/${match.filename}`)} 
                        alt={match.filename}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-2 space-y-1.5 bg-card">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-muted-foreground tracking-widest uppercase">SIM_SCORE</span>
                        <span className="text-primary font-bold">{(match.similarityScore * 100).toFixed(2)}%</span>
                      </div>
                      <div className="h-0.5 bg-muted w-full"><div className="h-full bg-primary" style={{width: `${match.similarityScore * 100}%`}}></div></div>
                      
                      <div className="pt-1 flex justify-between items-center text-[9px] text-muted-foreground tracking-widest uppercase truncate">
                        <span className="truncate mr-2" title={match.category || 'UNCAT'}>{match.category || 'UNCAT'}</span>
                        <span>D:{match.distance.toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {result.results.length === 0 && (
                  <div className="col-span-full h-48 flex items-center justify-center text-sm tracking-widest text-muted-foreground uppercase border border-dashed border-border">
                    NO_MATCHES_EXCEED_THRESHOLD
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
