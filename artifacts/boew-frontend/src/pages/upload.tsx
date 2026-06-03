import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, FileImage, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListDatasetImagesQueryKey, getGetDatasetStatsQueryKey } from "@workspace/api-client-react";

export default function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setProgress(10);
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    if (category) {
      formData.append('category', category);
    }

    try {
      const token = localStorage.getItem("boew_token");
      setProgress(40);
      const res = await fetch("/api/dataset/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      setProgress(80);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setProgress(100);
      
      toast({
        title: "UPLOAD_COMPLETE",
        description: `Successfully indexed ${data.indexed} of ${data.uploaded} assets.`,
      });

      queryClient.invalidateQueries({ queryKey: getListDatasetImagesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDatasetStatsQueryKey() });
      
      setTimeout(() => setLocation("/dataset"), 1000);
    } catch (error: any) {
      toast({
        title: "UPLOAD_ERROR",
        description: error.message,
        variant: "destructive"
      });
      setProgress(0);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 mt-8">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-widest text-primary uppercase">DATASET_INGESTION</h1>
        <p className="text-muted-foreground text-xs tracking-wider mt-1">SECURE BATCH UPLOAD PROTOCOL</p>
      </div>

      <Card className="rounded-none border-border bg-card shadow-xl relative overflow-hidden">
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 z-50 flex flex-col items-center justify-center p-8 backdrop-blur-sm">
            <div className="w-full max-w-md space-y-4">
              <div className="flex justify-between text-xs tracking-widest font-bold text-primary">
                <span>TRANSMITTING_DATA...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-1 rounded-none bg-muted" />
              <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest animate-pulse">
                ENCRYPTING_FEATURES & SYNCHRONIZING_INDEX
              </p>
            </div>
          </div>
        )}

        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">ASSET_CATEGORY (OPTIONAL)</Label>
            <Input 
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. satellite_imagery, medical_scans..."
              className="rounded-none bg-background border-border focus-visible:ring-primary font-mono text-sm"
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">ASSET_PAYLOAD</Label>
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 transition-colors bg-muted/5 cursor-pointer flex flex-col items-center justify-center p-12 group"
            >
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <UploadCloud className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors mb-4" />
              <div className="text-sm font-bold tracking-widest uppercase mb-1">CLICK_OR_DRAG_ASSETS_HERE</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">SUPPORTED: JPG, PNG, WEBP</div>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>STAGED_ASSETS</span>
                <span>{files.length} FILES</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 bg-background border border-border p-2 group relative">
                    <FileImage className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-[10px] truncate flex-1" title={file.name}>{file.name}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 p-1 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            className="w-full rounded-none tracking-widest uppercase font-bold"
            disabled={files.length === 0 || isUploading}
            onClick={handleUpload}
          >
            INITIATE_TRANSFER
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
