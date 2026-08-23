import { useState } from "react";
import { useListDatasetImages, useGetDatasetStats, useDeleteDatasetImage, getListDatasetImagesQueryKey, getGetDatasetStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Image as ImageIcon, SearchX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { resolveApiUrl } from "@/lib/api-config";

export default function Dataset() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListDatasetImages({ page, limit: 24 });
  const { data: stats } = useGetDatasetStats();
  const deleteMutation = useDeleteDatasetImage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = (id: number) => {
    if (!confirm("CONFIRM DELETION OF ASSET?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "ASSET_DELETED", description: "Successfully purged from index." });
        queryClient.invalidateQueries({ queryKey: getListDatasetImagesQueryKey({ page, limit: 24 }) });
        queryClient.invalidateQueries({ queryKey: getGetDatasetStatsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "DELETION_FAILED", description: (err.data as { error?: string })?.error || "Unknown error", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-widest text-primary uppercase">DATASET_REGISTRY</h1>
          <p className="text-muted-foreground text-xs tracking-wider mt-1">AUTHORIZED ASSETS ONLY</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-4 text-xs tracking-widest text-muted-foreground px-4 py-2 border border-border bg-card">
            <span>TOTAL: <strong className="text-primary">{stats?.totalImages || 0}</strong></span>
            <span>INDEXED: <strong className="text-primary">{stats?.indexedImages || 0}</strong></span>
            <span>SIZE: <strong className="text-primary">{stats?.totalSizeMb?.toFixed(2) || 0}MB</strong></span>
          </div>
          <Link href="/upload" className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 rounded-none tracking-widest uppercase">
            UPLOAD_NEW
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm tracking-widest animate-pulse">
          SCANNING_REGISTRY...
        </div>
      ) : data?.images?.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm tracking-widest border border-dashed border-border bg-muted/5">
          <SearchX className="w-8 h-8 mb-4 text-muted-foreground/50" />
          <span>NO_ASSETS_FOUND</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {data?.images.map((img) => (
            <Card key={img.id} className="rounded-none border-border bg-card overflow-hidden group relative">
              <div className="aspect-square relative bg-muted/20 border-b border-border">
                <img 
                  src={resolveApiUrl(`/api/images/${img.filename}`)} 
                  alt={img.originalName}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  {img.hasFeatures && (
                    <Badge variant="default" className="rounded-none text-[10px] px-1 py-0 bg-primary/20 text-primary border-primary/50">IDX</Badge>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="rounded-none tracking-widest text-[10px] h-7"
                    onClick={() => handleDelete(img.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> PURGE
                  </Button>
                </div>
              </div>
              <div className="p-2">
                <div className="text-[10px] font-mono text-muted-foreground truncate" title={img.originalName}>
                  {img.originalName}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[9px] text-primary tracking-widest uppercase">{img.category || 'UNCAT'}</span>
                  <span className="text-[9px] text-muted-foreground">{(img.fileSize! / 1024).toFixed(1)}KB</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {data && data.total > data.limit && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button 
            variant="outline" 
            className="rounded-none border-border tracking-widest uppercase"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            PREV_PAGE
          </Button>
          <span className="text-xs text-muted-foreground tracking-widest">
            PAGE {page} OF {Math.ceil(data.total / data.limit)}
          </span>
          <Button 
            variant="outline" 
            className="rounded-none border-border tracking-widest uppercase"
            disabled={page >= Math.ceil(data.total / data.limit)}
            onClick={() => setPage(p => p + 1)}
          >
            NEXT_PAGE
          </Button>
        </div>
      )}
    </div>
  );
}
