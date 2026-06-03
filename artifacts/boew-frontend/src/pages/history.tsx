import { useState } from "react";
import { useListHistory, useGetHistoryItem, getGetHistoryItemQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function History() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListHistory({ page, limit: 10 });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  const { data: detailData, isLoading: detailLoading } = useGetHistoryItem(selectedId as number, {
    query: {
      enabled: selectedId !== null,
      queryKey: getGetHistoryItemQueryKey(selectedId ?? 0),
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-widest text-primary uppercase">QUERY_LOGS</h1>
          <p className="text-muted-foreground text-xs tracking-wider mt-1">HISTORICAL RETRIEVAL RECORDS</p>
        </div>
      </div>

      <Card className="rounded-none border-border bg-card shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs tracking-widest uppercase text-muted-foreground h-10">OP_ID</TableHead>
                <TableHead className="font-mono text-xs tracking-widest uppercase text-muted-foreground h-10">TIMESTAMP</TableHead>
                <TableHead className="font-mono text-xs tracking-widest uppercase text-muted-foreground h-10">TARGET</TableHead>
                <TableHead className="font-mono text-xs tracking-widest uppercase text-muted-foreground h-10">METRIC</TableHead>
                <TableHead className="font-mono text-xs tracking-widest uppercase text-muted-foreground h-10 text-right">TIME(ms)</TableHead>
                <TableHead className="font-mono text-xs tracking-widest uppercase text-muted-foreground h-10 text-right">MATCHES</TableHead>
                <TableHead className="font-mono text-xs tracking-widest uppercase text-muted-foreground h-10 text-right">PRECISION</TableHead>
                <TableHead className="font-mono text-xs tracking-widest uppercase text-muted-foreground h-10 w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono text-sm">
              {isLoading ? (
                <TableRow className="border-border"><TableCell colSpan={8} className="text-center py-8 text-muted-foreground animate-pulse tracking-widest">RETRIEVING_LOGS...</TableCell></TableRow>
              ) : data?.history.length === 0 ? (
                <TableRow className="border-border"><TableCell colSpan={8} className="text-center py-8 text-muted-foreground tracking-widest uppercase">NO_RECORDS_FOUND</TableCell></TableRow>
              ) : (
                data?.history.map((row) => (
                  <TableRow key={row.id} className="border-border border-b hover:bg-muted/10 transition-colors">
                    <TableCell className="font-bold text-primary">{row.id.toString().padStart(6, '0')}</TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(row.createdAt), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-muted/20 border border-border flex-shrink-0">
                          <img src={`/api/uploads/${row.queryImagePath.split('/').pop()}`} alt="query" className="w-full h-full object-cover opacity-80" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] tracking-widest uppercase">{row.metric}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.retrievalTimeMs}</TableCell>
                    <TableCell className="text-right font-bold">{row.resultCount}</TableCell>
                    <TableCell className="text-right">
                      {row.precision ? `${(row.precision * 100).toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-border" onClick={() => setSelectedId(row.id)}>
                        <ExternalLink className="w-4 h-4 text-primary" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data && data.total > data.limit && (
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" className="rounded-none tracking-widest uppercase text-xs h-8" disabled={page === 1} onClick={() => setPage(p => p - 1)}>PREV</Button>
          <span className="text-xs text-muted-foreground tracking-widest uppercase">PAGE {page} / {Math.ceil(data.total / data.limit)}</span>
          <Button variant="outline" className="rounded-none tracking-widest uppercase text-xs h-8" disabled={page >= Math.ceil(data.total / data.limit)} onClick={() => setPage(p => p + 1)}>NEXT</Button>
        </div>
      )}

      <Dialog open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="sm:max-w-[800px] bg-card border-border rounded-none shadow-2xl p-0 gap-0">
          <DialogHeader className="p-4 border-b border-border bg-muted/10">
            <DialogTitle className="font-mono text-sm tracking-widest uppercase text-primary">
              LOG_DETAIL // OP_ID: {selectedId?.toString().padStart(6, '0')}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {detailLoading ? (
              <div className="h-64 flex items-center justify-center font-mono text-sm tracking-widest animate-pulse text-muted-foreground">DECRYPTING_RECORD...</div>
            ) : detailData ? (
              <div className="space-y-6 font-mono">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border border-border p-4 bg-muted/5">
                  <div>
                    <div className="text-[10px] text-muted-foreground tracking-widest mb-1">METRIC</div>
                    <div className="text-xs font-bold uppercase">{detailData.metric}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground tracking-widest mb-1">LATENCY</div>
                    <div className="text-xs font-bold text-primary flex items-center gap-1"><Clock className="w-3 h-3"/>{detailData.retrievalTimeMs}ms</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground tracking-widest mb-1">mAP SCORE</div>
                    <div className="text-xs font-bold">{(detailData.metrics.mAP * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground tracking-widest mb-1">TIMESTAMP</div>
                    <div className="text-xs font-bold">{format(new Date(detailData.createdAt), "HH:mm:ss")}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3">TOP 5 MATCHES</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {detailData.results.slice(0, 5).map(match => (
                      <div key={match.imageId} className="border border-border relative group">
                        <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-[8px] font-bold px-1 z-10">#{match.rank}</div>
                        <div className="aspect-square bg-black p-1">
                          <img src={`/api/images/${match.filename}`} alt="match" className="w-full h-full object-cover opacity-80" />
                        </div>
                        <div className="p-1 bg-card text-center text-[10px] text-primary font-bold border-t border-border">
                          {(match.similarityScore * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
